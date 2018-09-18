var eosjs = '';
var eos = null;
var scatter = null;
var loginflag = 0;
var sellersel = '';
var sellerprice = '';
var network = {
	blockchain: 'eos',
	protocol: 'https',
	host: 'mainnet.eoscannon.io',
	port: 443,
	chainId: 'aca376f206b8fc25a6ed44dbdc66547c36c6c33e3a119ffbeaef943642f0e906'
};

function EosjsInit() {
	var eosConfig = {
		chainId: 'aca376f206b8fc25a6ed44dbdc66547c36c6c33e3a119ffbeaef943642f0e906',
		httpEndpoint: 'https://mainnet.eoscannon.io',
		verbose: true
	}

	eosjs = Eos(eosConfig);
}

function getaccountinfo(accountname) {
	eosjs.getAccount(accountname, function (error, data) {
		if (error == null) {
			var ram_quota = data["ram_quota"] / 1024.00;
			ram_quota = ram_quota.toFixed(2);
			var ram_usage = data["ram_usage"] / 1024.00;
			ram_usage = ram_usage.toFixed(2);
			var ram_per = (ram_usage / ram_quota) * 100;
			ram_per = ram_per.toFixed(2);
			var ram_text = ram_usage + "KB/" + ram_quota + "KB";
			$("#circle").circleChart({
				value: ram_per,
				onDraw: function (el, circle) {
					circle.text(ram_text);
				}
			});
			$("#raminfo").text("占用:" + ram_per + "%");
		} else {
			Dialog.init(error);
		}
	})
}

function transfersell() {
	try {

		scatter.getIdentity({
			accounts: [network]
		}).then(function (identity) {
			var account = identity.accounts[0];
			var options = {
				authorization: account.name + '@' + account.authority,
				broadcast: true,
				sign: true
			};

			eos.contract($("#coinname").val().split(' ')[0], options).then(contract => {
				var priceint = 1/$("#coinpriceid").val();
				console.log("priceint is "+priceint.toFixed(0));
				contract.transfer(account.name, "cointotheeos", $("#coincntid").val() + '.0000 ' + $("#coinname").val().split(' ')[1], priceint.toFixed(0)).then(function (tx) {
					Dialog.init('Success!');
					//getaccountinfo(account.name);
				}).catch(function (e) {
					e = JSON.parse(e);
					Dialog.init('Tx failed: ' + e.error.details[0].message);
				});
			});
		})

	} catch (e) {
		Dialog.init(e);
	}
}

function transferbuy() {
	try {

		scatter.getIdentity({
			accounts: [network]
		}).then(function (identity) {
			var account = identity.accounts[0];
			var options = {
				authorization: account.name + '@' + account.authority,
				broadcast: true,
				sign: true
			};

			eos.contract('eosio.token', options).then(contract => {
				console.log("seller price is "+sellerprice);
				var cointoeos = $("#eoscntid").val() * sellerprice;
				console.log("cointoeos is "+cointoeos.toFixed(4));
				contract.transfer(account.name, "cointotheeos", cointoeos.toFixed(4) + ' EOS', sellersel).then(function (tx) {
					Dialog.init('Success!');
					//getaccountinfo(account.name);
				}).catch(function (e) {
					e = JSON.parse(e);
					Dialog.init('Tx failed: ' + e.error.details[0].message);
				});
			});
		})

	} catch (e) {
		Dialog.init(e);
	}
}

function home() {
	$("#tablediv").show();
	$("#actiondiv").hide();

	$("#login").css("display", "none");
	$("#gosellbtn").css("display", "block");
	$("#homebtn").css("display", "none");
}

function sellorbuy(type) {
	$("#tablediv").hide();
	$("#actiondiv").show();
	if (type == 1) {
		$("#actionselldiv").show();
		$("#actionbuydiv").hide();
	} else if (type == 2) {
		$("#actionselldiv").hide();
		$("#actionbuydiv").show();
	}

	$("#login").css("display", "none");
	$("#gosellbtn").css("display", "none");
	$("#homebtn").css("display", "block");
}

function wantbuy(obj) {
	if (loginflag == 0) {
		Dialog.init("请先点击登录");
		return;
	}

	sellersel = $(obj).parent().parent().find('td').eq(0).html();
	sellerprice = $(obj).parent().parent().find('td').eq(1).find("p").html().split(' ')[0];

	console.log("seller is "+sellersel+ " sellerprice is "+sellerprice);
	
	sellorbuy(2);
}

function sell() {
	if (loginflag == 0) {
		Dialog.init("请先点击登录");
	}

	if (checkcoin() == -1) {
		return -1;
	}

	if (checkprice() == -1) {
		return -1;
	}
	transfersell();
}

function buy() {
	if (loginflag == 0) {
		Dialog.init("请先点击登录");
	}

	if (checkeos() == -1) {
		return -1;
	}

	transferbuy();
}

function checkcoin() {
	var r = /^[0-9]+$/;
	var count = $("#coincntid").val();
	if (!r.test(count)) {
		Dialog.init("数量须为整数");
		return -1;
	}
}

function checkeos() {
	return 0;
	var r = /^[0-9]+$/;
	var count = $("#eoscntid").val();
	if (!r.test(count)) {
		Dialog.init("数量须为整数");
		return -1;
	}
}

function checkprice() {
	return 0;
	var r = /^[0-9]+$/;
	var count = $("#coinpriceid").val();
	if (!r.test(count)) {
		Dialog.init("价格须为整数");
		return -1;
	}
}

function sellerdel() {
	$("#sellertablebody").find("tr").filter(".old").remove();

	$("#sellertablebody").find("tr").attr("class", "old");
}

function selleradd(obj) {
	var sellername = obj["seller_account"];
	var sellerasset = obj["coin"];
	var sellerprice = 1/obj["price"];
	var sellerassetarr = sellerasset.split('.');
	var sellerassetaccount = sellerassetarr[0];
	var sellerassetname = sellerassetarr[1].split(' ')[1];
	var tritem = $("#sellertablebody").find(document.getElementById(sellername + sellerassetname));

	if (tritem.length == 0) {
		var tdseller = "<td>" + sellername + "</td>";
		var tdprice = "<td><p style='font-size:80%;'>" + sellerprice.toFixed(6) + " EOS</p></td>";
		var tdcount = "<td>" + sellerassetaccount + "</td>";
		var tdbuy = "<td><button class='btn' onclick='wantbuy(this)'>购买</button></td>";

		var item = "<tr id='" + sellername + sellerassetname + "' class='update'>" + tdseller + tdprice + tdcount + tdbuy + "</tr>";

		$("#sellertablebody").append(item);

	} else {
		var tditem = tritem.find('td');
		tditem.eq(0).html(sellername);
		tditem.eq(1).find("p").text(sellerprice.toFixed(6) + " EOS");
		tditem.eq(2).html(sellerassetaccount);
		tritem.attr("class", "update");
	}

}

function sellersort(obj)
{
	var cnt = obj.length;
	var tmpobj = '';
	for(var i = 0; i < cnt; i++)
	{
		for(var j =0; j < cnt; j++)
		{
			if(i != j)
			{
				if(obj[j]["price"] < obj[i]["price"])
				{
					tmpobj = obj[j];
					obj[j] = obj[i];
					obj[i] = tmpobj;
				}
			}
		}
	}
}

function getsellerlist() {
	eosjs.getTableRows(true, "cointotheeos", "0", "seller", "", 0, -1, 10000, function (error, data) {
		if (error == null) {
			$("#logid").html(JSON.stringify(data, null, 2));

			//console.log(JSON.parse(data));
			sellersort(data["rows"]);
			var cnt = data["rows"].length;
			for (var i = 0; i < cnt; i++) {
				selleradd(data["rows"][i]);
			}

			sellerdel();
		} else {
			console.log(error);
		}
	})
}

function scatterLogin() {
	if (!scatter) {
		Dialog.init("Please install Scatter!");
		return;
	}

	scatter.getIdentity({
		accounts: [network]
	}).then(function (identity) {
		var account = identity.accounts[0];
		loginflag = 1;
		//Dialog.init(account.name + " 已登录");
		//getaccountinfo(account.name);
		$("#curaccount").show();
		$("#curaccount").text(account.name);
		$("#login").css("display", "none");
		$("#gosellbtn").css("display", "block");
		$("#homebtn").css("display", "none");
	}).catch(function (e) {
		console.log(e);
	});
}

$(function () {
	EosjsInit();
	document.addEventListener('scatterLoaded', function (scatterExtension) {
		console.log("scatterLoaded enter");
		scatter = window.scatter;
		eos = scatter.eos(network, Eos, {}, "https");
	});
	//setTimeout(scatterLogin, 3000);
	setInterval(getsellerlist, 3000);
})

function emptycontent(obj) {
	$(obj).html("");
}