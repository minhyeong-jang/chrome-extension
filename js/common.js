var lib = lib || {};

/**
 * Ajax 간편화
 * lib.ajaxSubmit('https://test.co.kr', 'post', {a:'1',b:'2'}, function(status, message){ ... });
 * return results, status
 */
lib.ajaxSubmit = function (url, type, data, callback) {
  $.ajax({
    url: url,
    type: type,
    data: data,
    success: function (data) {
      callback(data);
    },
    cache: false,
    contentType: false,
    processData: false,
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
