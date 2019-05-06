registerEA(
"sample_run_neuron_model",
"A test EA to run neuron model",
[{
	name: "period",
	value: 20,
	required: true,
	type: "Number",
	range: [1, 100]
}, {
	name: "inputNum",
	value: 20,
	required: true,
	type: "Number",
	range: [1, 100]
}, {
	name: "threshold",
	value: 0.3,
	required: true,
	type: "Number",
	range: [0, 1]
}, {
	name: "takeProfit",
	value: 0.0001,
	required: true,
	type: "Number",
	range: [0, 100]
}],
function (context) { // Init()
			if (typeof localStorage.sample_training_neuron_model == "undefined") return

			window.myPerceptron = synaptic.Network.fromJSON(JSON.parse(localStorage.sample_training_neuron_model))

			var account = getAccount(context, 0)
			var brokerName = getBrokerNameOfAccount(account)
			var accountId = getAccountIdOfAccount(account)
			var symbolName = "EUR/USD"

			getQuotes (context, brokerName, accountId, symbolName)
			window.chartHandle = getChartHandle(context, brokerName, accountId, symbolName, TIME_FRAME.M1)
			var period = getEAParameter(context, "period")
			window.indiHandle = getIndicatorHandle(context, brokerName, accountId, symbolName, TIME_FRAME.M1, "rsi", [{
				name: "period",
				value: period
			}])
		},
function (context) { // Deinit()
			delete window.currTime
		},
function (context) { // OnTick()
			var arrTime = getData(context, window.chartHandle, DATA_NAME.TIME)
			if (typeof window.currTime == "undefined") {
				window.currTime = arrTime[arrTime.length - 1]
			} else if (window.currTime != arrTime[arrTime.length - 1]) {
				window.currTime = arrTime[arrTime.length - 1]
			} else {
				return
			}

			var account = getAccount(context, 0)
			var brokerName = getBrokerNameOfAccount(account)
			var accountId = getAccountIdOfAccount(account)
			var symbolName = "EUR/USD"

			var period = getEAParameter(context, "period")
			var inputNum = getEAParameter(context, "inputNum")
			var threshold = getEAParameter(context, "threshold")
			var takeProfit = getEAParameter(context, "takeProfit")
			var arrRsi = getData(context, window.indiHandle, "rsi")

			if (inputNum + period - 1 > arrRsi.length) throw new Error("No enough data.")

			var input = []

			for (var i = arrRsi.length - inputNum - 1; i < arrRsi.length - 1; i++) {
				input.push(arrRsi[i] / 100)
			}

			var result = window.myPerceptron.activate(input)[0]
			printMessage(result)

			var ask = getAsk(context, brokerName, accountId, symbolName)
			var bid = getBid(context, brokerName, accountId, symbolName)
			var volume = 0.01

			if (result < 0.5 - threshold) {
				sendOrder(brokerName, accountId, symbolName, ORDER_TYPE.OP_BUY, 0, 0, volume, ask+takeProfit, bid-3*takeProfit, "")
			} else if (result > 0.5 + threshold) {
				sendOrder(brokerName, accountId, symbolName, ORDER_TYPE.OP_SELL, 0, 0, volume, bid-takeProfit, ask+3*takeProfit, "")
			}
		})
