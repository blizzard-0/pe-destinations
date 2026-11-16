// A fixed locale keeps output consistent between the server and every browser,
// and matches the USD amounts in the data.
const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const numberFormatter = new Intl.NumberFormat("en-US");

const formatCurrency = (value: number) => currencyFormatter.format(value);

const formatNumber = (value: number) => numberFormatter.format(value);

export { formatCurrency, formatNumber };
