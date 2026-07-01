const { PrismaClient } = require("@prisma/client");
const { Decimal } = require("@prisma/client/runtime/library");

console.log("Decimal before override toJSON:", new Decimal("20000.00").toJSON());

Decimal.prototype.toJSON = function() {
  return this.toNumber();
};

console.log("Decimal after override toJSON:", new Decimal("20000.00").toJSON());
console.log("JSON.stringify of Decimal:", JSON.stringify({ amount: new Decimal("20000.00") }));
