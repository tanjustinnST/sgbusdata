const DOMParser = require("@xmldom/xmldom").DOMParser;

module.exports = (str) => {
  return new DOMParser().parseFromString(str);
};
