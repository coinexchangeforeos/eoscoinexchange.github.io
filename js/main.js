var eosjs = '';
var eos = null;
var scatter = null;
var loginflag = 0;
var sellersel = '';
var sellerprice = '';
var curcointype = '';
var curcoindeal = 'all';
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

function formatDateTime(inputTime) {
	if (inputTime == 0) {
		return "未记录";
	}
	var date = new Date(inputTime);
	var y = date.getFullYear();
	var m = date.getMonth() + 1;
	m = m < 10 ? ('0' + m) : m;
	var d = date.getDate();
	d = d < 10 ? ('0' + d) : d;
	var h = date.getHours();
	h = h < 10 ? ('0' + h) : h;
	var minute = date.getMinutes();
	var second = date.getSeconds();
	minute = minute < 10 ? ('0' + minute) : minute;
	second = second < 10 ? ('0' + second) : second;
	return y + '/' + m + '/' + d + ' ' + h + ':' + minute + ':' + second;
};

function swapRow(i, k) {
	var tb = $("#sellertablebody").find("tr");

	$(tb).eq(k).insertBefore($(tb).eq(i));

	$(tb).eq(i).insertAfter($(tb).eq(k));

}

function SortTb(col, order) {

	var tb = $("#sellertablebody").find("tr");

	var total = tb.length;

	//外层循环，共要进行arr.length次求最大值操作

	for (var i = 0; i < total; i++)

	{

		//内层循环，找到第i大的元素，并将其和第i个元素交换

		for (var j = i; j < total; j++)

		{

			var v = $(tb).eq(i).find("td").eq(col).find("p").html().split(' ')[0];

			var v2 = $(tb).eq(j).find("td").eq(col).find("p").html().split(' ')[0];

			if (v > v2)

			{

				//交换两个元素的位置

				swapRow(i, j);

				tb = $("#sellertablebody").find("tr");

			}

		}

	}

	return;
}

function sellcoinchange() {
	$("#sellcoincntid").attr("placeholder", "请输入想出售或收回的" + $("#coinname").val().split(' ')[1] + "数量");

	eosjs.getTableRows(true, $("#coinname").val().split(' ')[0], $("#loginbtn").html(), "accounts", function (error, data) {
		if (error == null) {
			var cnt = data["rows"].length;
			if (cnt == 0) {
				console.log($("#coinname").val());
				$("#accounttoken").text("余额:0.0000 " + $("#coinname").val().split(' ')[1]);
			} else {
				for (var i = 0; i < cnt; i++) {
					var balance = data["rows"][i]["balance"];
					console.log("balance is " + balance.split(' ')[1]);
					if (balance.split(' ')[1] == $("#coinname").val().split(' ')[1]) {
						$("#accounttoken").text("余额:" + balance);
						break;
					}
				}

				if (i == cnt) {
					$("#accounttoken").text("余额:0.0000 " + $("#coinname").val().split(' ')[1]);
				}
			}
		} else {
			console.log(error);
		}
	})
}

function transfersell() {
	try {
		var priceint = accMul($("#coinpriceid").val(), 1000000);
		console.log("priceint is " + priceint);

		if (tp.isConnected() == true && 0) {
			tp.eosTokenTransfer({
				from: $("#loginbtn").html(),
				to: 'cointotheeos',
				amount: $("#sellcoincntid").val() + '.0000',
				tokenName: $("#coinname").val().split(' ')[1],
				precision: 4,
				contract: $("#coinname").val().split(' ')[0],
				memo: priceint,
			}).then(function (data) {
				//Dialog.init('Success!');
				sellcoinchange();
			}).catch(function (err) {
				Dialog.init(JSON.stringify(err));
			});
		} else {
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
					contract.transfer(account.name, "cointotheeos", $("#sellcoincntid").val() + '.0000 ' + $("#coinname").val().split(' ')[1], priceint, options).then(function (tx) {
						Dialog.init('Success!');
						sellcoinchange();
						//getaccountinfo(account.name);
					}).catch(function (e) {
						console.log(e);
						e = JSON.parse(e);
						Dialog.init('Tx failed: ' + e.error.details[0].message);
					});
				});

			})
		}
	} catch (e) {
		Dialog.init(e);
	}
}

function transfergetback() {
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
			eos.contract('cointotheeos', options).then(contract => {
				contract.takeback(account.name, $("#sellcoincntid").val() + '.0000 ' + $("#coinname").val().split(' ')[1], options).then(function (tx) {
					Dialog.init('Success!');
					sellcoinchange();
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
		var cointoeos = accMul($("#buycoincntid").val(), sellerprice);
		if (cointoeos.toFixed(4) != cointoeos) {
			if (cointoeos.toFixed(4) < cointoeos) {
				cointoeos = cointoeos + 0.0001;
			}
		}

		console.log("transferbuy cointoeos is " + cointoeos.toFixed(4));

		if (tp.isConnected() == true && 0) {
			tp.eosTokenTransfer({
				from: $("#loginbtn").html(),
				to: 'cointotheeos',
				amount: cointoeos.toFixed(4),
				tokenName: 'EOS',
				precision: 4,
				contract: 'eosio.token',
				memo: sellersel,
			}).then(function (data) {
				//Dialog.init('Success!');
				sellcoinchange();
			}).catch(function (err) {
				Dialog.init(JSON.stringify(err));
			});
		} else {
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
					contract.transfer(account.name, "cointotheeos", cointoeos.toFixed(4) + ' EOS', sellersel + " " + curcointype, options).then(function (tx) {
						Dialog.init('Success!');
						sellcoinchange();
						//getaccountinfo(account.name);
					}).catch(function (e) {
						e = JSON.parse(e);
						Dialog.init('Tx failed: ' + e.error.details[0].message);
					});
				});
			})
		}
	} catch (e) {
		Dialog.init(e);
	}
}

function wantbuy(obj) {
	if (loginflag == 0) {
		Dialog.init("请先点击登录");
		return;
	}

	$("#buycoincntid").val('');
	$("#accounteos").text('需支付:0 EOS');
	sellersel = $(obj).parent().parent().find('td').eq(0).html();
	sellerprice = $(obj).parent().parent().find('td').eq(1).find("p").html().split(' ')[0];

	console.log("seller is " + sellersel + " sellerprice is " + sellerprice);

	// sellorbuy(2);

	$("#sellerlistid").hide();
	$("#actionbuydiv").show();
}

function getback() {
	if (loginflag == 0) {
		Dialog.init("请先点击登录");
	}

	if (checksellcoin() == -1) {
		return -1;
	}

	transfergetback();
}

function sell() {
	if (loginflag == 0) {
		Dialog.init("请先点击登录");
	}

	if (checksellcoin() == -1) {
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

	if (checkbuycoin() == -1) {
		return -1;
	}

	transferbuy();
}

function checksellcoin() {
	var r = /^[0-9]+$/;
	var count = $("#sellcoincntid").val();
	if (!r.test(count)) {
		Dialog.init("数量须为整数");
		return -1;
	}
}

function calbuyneedeos() {
	var cointoeos = accMul($("#buycoincntid").val(), sellerprice);
	if (cointoeos.toFixed(4) != cointoeos) {
		if (cointoeos.toFixed(4) < cointoeos) {
			cointoeos = cointoeos + 0.0001;
		}
	}
	$("#accounteos").text("需支付:" + cointoeos.toFixed(4) + " EOS");
}

function checkbuycoin() {
	var r = /^[0-9]+$/;
	var count = $("#buycoincntid").val();
	if (!r.test(count)) {
		Dialog.init("数量须为整数");
		return -1;
	}
}

function checkprice() {
	// var r = /^[0-9]+$/;
	// var count = $("#coinpriceid").val();
	// if (!r.test(count)) {
	// 	Dialog.init("价格须为整数");
	// 	return -1;
	// }
	var price = $("#coinpriceid").val();
	if (!(/(^[0-9]*[1-9][0-9]*$)/.test(price)) &&
		!(/^\d+(\.\d+)?$/.test(price))) {
		Dialog.init("价格输入格式有错，请输入整数或小数");
		return -1;
	}

	if (price < 0.000001) {
		Dialog.init("价格最小须为0.000001 EOS");
		return -1;
	}


	var g = /^\d+(?:\.\d{1,6})?$/;
	if (!g.test(price)) {
		Dialog.init("只支持六位小数");
		return -1;
	}
}

function accMul(arg1, arg2) {

	var m = 0,
		s1 = arg1.toString(),
		s2 = arg2.toString();

	try {
		m += s1.split(".")[1].length
	} catch (e) {}

	try {
		m += s2.split(".")[1].length
	} catch (e) {}

	return Number(s1.replace(".", "")) * Number(s2.replace(".", "")) / Math.pow(10, m)

}

function sellerdel() {
	$("#sellertablebody").find("tr").filter(".old").remove();

	$("#sellertablebody").find("tr").attr("class", "old");
}

function dealadd(obj) {
	var buyername = obj["buyer_account"];
	var sellername = obj["seller_account"];
	var sellerasset = obj["coin"];
	var sellerprice = obj["price"];
	var sellerassetarr = sellerasset.split('.');
	var sellerassetaccount = sellerassetarr[0];
	var sellerassetname = sellerassetarr[1].split(' ')[1];
	var dealindex = obj["pkey"];
	var dealtime = obj["buytime"];
	var tritem = $("#deallistbody").find(document.getElementById(dealindex));

	if (sellerassetaccount == 0) {
		return -1;
	}

	if (tritem.length == 0) {
		if (sellerassetname == curcoindeal || curcoindeal == 'all') {
			var tdbuyer = "<td style='word-wrap:break-word;word-break:break-all;text-align:center;'>" + buyername + "</td>";
			var tdseller = "<td style='word-wrap:break-word;word-break:break-all;text-align:center;'>" + sellername + "</td>";
			var tdprice = "<td style='text-align:center;'><p >" + sellerprice + "</p></td>";
			var tdcount = "<td style='text-align:center;'>" + sellerassetaccount + " " + sellerassetname + "</td>";
			var tddealtime = "<td style='text-align:center;'>" + formatDateTime(dealtime / 1000) + "</td>";
			var item = "<tr style='font-size:80%;' id='" + dealindex + "' class='update'>" + tdbuyer + tdseller + tdprice + tdcount + tddealtime + "</tr>";

			$("#deallistbody").prepend(item);
		}
	} else {
		tritem.attr("class", "update");
	}
}

function dealdel() {
	$("#deallistbody").find("tr").filter(".old").remove();

	$("#deallistbody").find("tr").attr("class", "old");
}

function selleradd(obj) {
	var sellername = obj["seller_account"];
	var sellerasset = obj["coin"];
	var sellerprice = obj["price"];
	var sellerassetarr = sellerasset.split('.');
	var sellerassetaccount = sellerassetarr[0];
	var sellerassetname = sellerassetarr[1].split(' ')[1];
	var tritem = $("#sellertablebody").find(document.getElementById(sellername + sellerassetname));

	if (sellerassetaccount == 0) {
		return -1;
	}

	if (tritem.length == 0) {
		var tdseller = "<td style='word-wrap:break-word;word-break:break-all;'>" + sellername + "</td>";
		var tdprice = "<td><p >" + sellerprice + "</p></td>";
		var tdcount = "<td>" + sellerassetaccount + "</td>";
		var tdcoinname = "<td>" + sellerassetname + "</td>";
		var tdbuy = "<td><button class='btn' onclick='wantbuy(this)'>购买</button></td>";

		var item = "<tr style='font-size:80%;' id='" + sellername + sellerassetname + "' class='update'>" + tdseller + tdprice + tdcount + tdcoinname + tdbuy + "</tr>";

		$("#sellertablebody").append(item);

	} else {
		var tditem = tritem.find('td');
		tditem.eq(0).html(sellername);
		tditem.eq(1).find("p").text(sellerprice);
		tditem.eq(2).html(sellerassetaccount);
		tritem.attr("class", "update");
	}

}

function sellersort(obj) {
	var cnt = obj.length;
	var tmpobj = '';
	for (var i = 0; i < cnt; i++) {
		for (var j = 0; j < cnt; j++) {
			if (i != j) {
				if (obj[j]["price"] < obj[i]["price"]) {
					tmpobj = obj[j];
					obj[j] = obj[i];
					obj[i] = tmpobj;
				}
			}
		}
	}
}

function getsellerlist() {
	var cointype = $("#tokenul .active").find('a').html().split(' ')[0];
	var pkey = $("#tokenul .active").find('a').attr('id').split(' ')[1];
	console.log("cointype is " + cointype);

	if (cointype != undefined) {
		curcointype = cointype;
	}

	if (curcointype == undefined) {
		return -1;
	}

	console.log("getsellerlist pkey is " + pkey);

	eosjs.getTableRows(true, "cointotheeos", pkey, "sellerlist", "", 0, -1, 10000, function (error, data) {
		if (error == null) {
			//console.log(JSON.parse(data));
			//sellersort(data["rows"]);
			var cnt = data["rows"].length;
			for (var i = 0; i < cnt; i++) {
				selleradd(data["rows"][i]);
			}

			SortTb(1);

			sellerdel();
		} else {
			console.log(error);
		}
	})
}

function getdeallist() {
	eosjs.getTableRows(true, "cointotheeos", "cointotheeos", "buyrecords", "", 0, -1, 10000, function (error, data) {
		if (error == null) {
			var cnt = data["rows"].length;
			for (var i = 0; i < cnt; i++) {
				dealadd(data["rows"][i]);
			}

			//SortTb(1);

			dealdel();
		} else {
			console.log(error);
		}
	})
}

function coindeallichange(obj) {
	var symbol = $(obj).html();

	if (symbol != curcoindeal) {
		$("#deallistbody").empty();
	}


	if ($(obj).attr('id') != "coindealallid") {
		curcoindeal = symbol;
		if ($("#coindealul").find(document.getElementById('coindealallid')).length == 0) {
			var coindeal = '';
			coindeal = '<li><a id="coindealallid" onclick="javascript:coindeallichange(this)">全部</a></li>';
			$("#coindealul").prepend(coindeal);
		}
	} else {
		curcoindeal = 'all';
		$(obj).parent().remove();
	}

	$("#coindealtype").html(symbol + '<b class="caret"></b>');
}

function coinadd(obj) {
	var pkey = obj["pkey"];
	var contract = obj["contract"];
	var symbol = obj["quant"].split(' ')[1];
	var enable = obj["enable"];

	if (enable == 0) {
		return 0;
	}

	var coinli = '';

	if (symbol == "BT") {
		coinli = //'<li class="divider"></li>' +
			'<li><a href="#tablediv" data-toggle="tab" id="coin ' +
			pkey + '" class="' + symbol + '" onclick="gohomefroma(this)">' + symbol + ' <i>' + contract + '</i></a></li>';
	} else {
		coinli = //'<li class="divider"></li>' +
			'<li><a href="#tablediv" data-toggle="tab" id="coin ' +
			pkey + '" class="' + symbol + '" onclick="gohomefroma(this)">' + symbol + ' <i>' + contract + '</i></a></li>';
	}

	$("#tokenul").append(coinli);

	var coindeal = '';
	coindeal = '<li><a onclick="javascript:coindeallichange(this)">' + symbol + '</a></li>';
	$("#coindealul").append(coindeal);

	var coinseloption = '<option value="' + contract + " " + symbol + '">' + symbol + '</option>';
	$("#coinname").append(coinseloption);

	if($("#example-navbar-collapse").find(".active").length == 0)
	{
		$(".BT").click();
	}
}

function getcoinlist() {
	eosjs.getTableRows(true, "cointotheeos", "cointotheeos", "coins", "", 0, -1, 10000, function (error, data) {
		if (error == null) {
			var cnt = data["rows"].length;
			for (var i = 0; i < cnt; i++) {
				coinadd(data["rows"][i]);
			}
		} else {
			console.log(error);
		}
	})
}

function getglobaldata() {
	eosjs.getTableRows(true, "cointotheeos", "cointotheeos", "global", "", 0, -1, 10, function (error, data) {
		if (error == null) {
			var cnt = data["rows"].length;
			for (var i = 0; i < cnt; i++) {
				$("#totaldealasset").text("总成交额: " + data["rows"][i]["dealtotalasset"]);
			}
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
		console.log(account.name + " 已登录");
		//Dialog.init(account.name + " 已登录");
		//getaccountinfo(account.name);
		$("#luli").before("<li><a href='#actiondiv' data-toggle='tab' style='font-size: 19px;'>卖</a></li>");
		$("#buyli").show();
		$("#loginbtn").attr("disabled", true);
		$("#loginbtn").html(account.name).css('color', '#1E90FF');

		//checkluroy(account.name);

		sellcoinchange();
	}).catch(function (e) {
		console.log(e);
	});
}

function checkluroy(name) {
	eosjs.getTableRows(true, "roulettespin", "roulettespin", "account", "", 0, -1, 10000, function (error, data) {
		if (error == null) {

			var cnt = data["rows"].length;
			for (var i = 0; i < cnt; i++) {
				if (data["rows"][i]["name"] == name) {
					$("#luroybtn").html("此账号已撸 10000 ROY");
					$("#luroybtn").attr("disabled", true);
					break;
				}
			}
		} else {
			console.log(error);
		}
	})
}

function luchips() {
	Dialog.init("由于合约帐号CHIPS不足，已暂停");
	return;
	if (loginflag == 0) {
		Dialog.init("请先点击登录");
		return;
	}

	scatter.getIdentity({
		accounts: [network]
	}).then(function (identity) {
		var account = identity.accounts[0];
		var options = {
			authorization: account.name + '@' + account.authority,
			broadcast: true,
			sign: true
		};

		eos.contract('efinitychips', options).then(contract => {
			contract.claim(account.name, "eosgametoken", options).then(function (tx) {
				Dialog.init('Success!');
				//getaccountinfo(account.name);
			}).catch(function (e) {
				console.log(e);
				e = JSON.parse(e);
				Dialog.init('Tx failed: ' + e.error.details[0].message);
			});
		});

	})
}

function luseven() {
	if (loginflag == 0) {
		Dialog.init("请先点击登录");
		return;
	}

	scatter.getIdentity({
		accounts: [network]
	}).then(function (identity) {
		var account = identity.accounts[0];
		var options = {
			authorization: account.name + '@' + account.authority,
			broadcast: true,
			sign: true
		};

		eos.contract('xxxsevensxxx', options).then(contract => {
			contract.signup(account.name, "10000.0000 SEVEN", options).then(function (tx) {
				Dialog.init('Success!');
				//getaccountinfo(account.name);
			}).catch(function (e) {
				console.log(e);
				e = JSON.parse(e);
				Dialog.init('Tx failed: ' + e.error.details[0].message);
			});
		});
	})
}

function gohome() {
	$("." + curcointype).click();
	$("#sellerlistid").show();
	$("#actionbuydiv").hide();
}

function gohomefroma(obj) {
	var cointype = $(obj).html().split(' ')[0];
	$("#sellerlistid").show();
	$("#actionbuydiv").hide();
	$("#buycoincntid").attr("placeholder", "请输入想购买的" + cointype + "数量");
}

$(function () {
	EosjsInit();
	document.addEventListener('scatterLoaded', function (scatterExtension) {
		console.log("scatterLoaded enter");
		scatter = window.scatter;
		eos = scatter.eos(network, Eos, {}, "https");
	});

	getcoinlist();
	setInterval(getsellerlist, 1000);
	setInterval(getdeallist, 2000);
	setInterval(getglobaldata, 3000);
})