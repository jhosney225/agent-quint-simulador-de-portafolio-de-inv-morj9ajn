
```javascript
const Anthropic = require("@anthropic-ai/sdk");
const readline = require("readline");

const client = new Anthropic();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

// Portfolio data structure
let portfolio = {
  cash: 10000,
  holdings: {},
  transactions: [],
  startDate: new Date(),
};

// Market data simulator
const marketData = {
  AAPL: { price: 150.25, change: 2.5 },
  GOOGL: { price: 140.8, change: 1.8 },
  MSFT: { price: 380.5, change: 3.2 },
  AMZN: { price: 175.2, change: 0.5 },
  TESLA: { price: 245.3, change: -1.2 },
  META: { price: 335.6, change: 2.1 },
};

function getPortfolioSummary() {
  let totalValue = portfolio.cash;
  let portfolioBreakdown = [];

  for (const [symbol, shares] of Object.entries(portfolio.holdings)) {
    const currentPrice = marketData[symbol].price;
    const holdingValue = shares * currentPrice;
    totalValue += holdingValue;
    portfolioBreakdown.push({
      symbol,
      shares,
      price: currentPrice,
      value: holdingValue,
    });
  }

  const portfolioReturn = ((totalValue - 10000) / 10000) * 100;

  return {
    totalValue: totalValue.toFixed(2),
    cash: portfolio.cash.toFixed(2),
    breakdown: portfolioBreakdown,
    return: portfolioReturn.toFixed(2),
  };
}

function generateASCIIChart(title, data) {
  const chartWidth = 50;
  const chartHeight = 10;
  const maxValue = Math.max(...data.map((d) => d.value));
  const minValue = 0;
  const range = maxValue - minValue;

  let chart = `\n${title}\n`;
  chart += "═".repeat(chartWidth + 10) + "\n";

  for (let i = chartHeight; i > 0; i--) {
    const threshold = (i / chartHeight) * range + minValue;
    let line = "";
    for (let j = 0; j < data.length; j++) {
      if (data[j].value >= threshold) {
        line += "█ ";
      } else {
        line += "  ";
      }
    }
    chart += line + "\n";
  }

  chart += "─".repeat(chartWidth + 10) + "\n";
  let labels = "";
  for (let j = 0; j < data.length; j++) {
    labels += data[j].label.slice(0, 2).padEnd(2, " ") + " ";
  }
  chart += labels + "\n";

  return chart;
}

function formatPortfolioDisplay() {
  const summary = getPortfolioSummary();

  let display = "\n╔════════════════════════════════════════╗\n";
  display += "║     PORTFOLIO SUMMARY                  ║\n";
  display += "╠════════════════════════════════════════╣\n";
  display += `║ Total Value: $${summary.totalValue.padStart(30)} ║\n`;
  display += `║ Cash Available: $${summary.cash.padStart(26)} ║\n`;
  display += `║ Portfolio Return: ${summary.return.padStart(23)}% ║\n`;
  display += "╠════════════════════════════════════════╣\n";
  display += "║ HOLDINGS:                              ║\n";

  if (summary.breakdown.length === 0) {
    display += "║ No holdings yet                        ║\n";
  } else {
    for (const holding of summary.breakdown) {
      const line = `║ ${holding.symbol}: ${holding.shares} shares @ $${holding.price.toFixed(2)} = $${holding.value.toFixed(2)}`.padEnd(
        41
      );
      display += line + "║\n";
    }
  }

  display += "╚════════════════════════════════════════╝\n";

  // Add ASCII chart
  const chartData = summary.breakdown.map((h) => ({
    label: h.symbol,
    value: h.value,
  }));
  if (chartData.length > 0) {
    display += generateASCIIChart("Portfolio Allocation Chart", chartData);
  }

  return display;
}

function processToolCall(toolName, toolInput) {
  if (toolName === "buy_stock") {
    const { symbol, quantity, price } = toolInput;
    const cost = quantity * price;

    if (cost > portfolio.cash) {
      return `Error: Insufficient funds. Need $${cost.toFixed(2)}, have $${portfolio.cash.toFixed(2)}`;
    }

    portfolio.holdings[symbol] = (portfolio.holdings[symbol] || 0) + quantity;
    portfolio.cash -= cost;
    portfolio.transactions.push({
      type: "BUY",
      symbol,
      quantity,
      price,
      date: new Date(),
    });

    return `Successfully bought ${quantity} shares of ${symbol} at $${price.toFixed(2)} for $${cost.toFixed(2)}`;
  } else if (toolName === "sell_stock") {
    const { symbol, quantity, price } = toolInput;

    if (!portfolio.holdings[symbol] || portfolio.holdings[symbol] < quantity) {
      return `Error: You don't have enough ${symbol} shares to sell. Holdings: ${portfolio.holdings[symbol