var lib = lib || {};

lib.getFloatFixed = (value, fixed) => {
  return parseFloat(Math.round(value * 100) / 100).toFixed(fixed);
};
lib.ajaxSubmit = ({ url, type, data, beforeSend }) => {
  return new Promise((resolve, reject) => {
    $.ajax({
      url: url,
      type: type,
      data: data,
      beforeSend: beforeSend,
      success: (data) => resolve(data),
      error: (e) => reject(e),
      cache: false,
      contentType: false,
      processData: false,
    });
  });
};

/**
 * JSON -> URL Parameter
 * lib.jsonToParameter({a:'1',b:'2'});
 * return 'a=1&b=2'
 */
lib.jsonToParameter = function (data) {
  var obj = [];
  for (var i in data) {
    obj.push(i + "=" + data[i]);
  }
  return "?" + obj.join("&");
};
