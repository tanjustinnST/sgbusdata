const { XMLParser } = require("fast-xml-parser");
const he = require("he");

module.exports = (xml, opts) => {
  const parser = new XMLParser({
    attributeNamePrefix: "",
    ignoreAttributes: false,
    parseAttributeValue: false,
    ignoreNameSpace: true,
    allowBooleanAttributes: true,
    attributeValueProcessor: (attrName, val) =>
      he.decode(val, { isAttributeValue: true }),
    tagValueProcessor: (tagName, val) => he.decode(val),
    ...opts,
  });
  return parser.parse(xml);
};
