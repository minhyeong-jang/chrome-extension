var lib = lib || {};

/**
 * 모달출력
 * lib.modalShow('delete-modal');
 */
lib.modalShow = function (name) {
  $(".modal[name=" + name + "]").modal("show");
};

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

/**
 * postGoto('경로', {'parm1':'val1','parm2':'val2'});
 */
lib.postGoto = function (url, parm) {
  var f = document.createElement("form");

  var objs, value;
  for (var key in parm) {
    value = parm[key];
    objs = document.createElement("input");
    objs.setAttribute("type", "hidden");
    objs.setAttribute("name", key);
    objs.setAttribute("value", value);
    f.appendChild(objs);
  }

  f.setAttribute("method", "post");
  f.setAttribute("action", url);
  document.body.appendChild(f);
  f.submit();
};

/**
 * getUrlParamValue('URL 주소', '가져올 파라미터명');
 * ex) getUrlParamValue('location?data=123','data') -> 123
 */
lib.getUrlParamValue = function (url, key) {
  var url_string = url;
  var url = new URL(url_string);
  return url.searchParams.get(key);
};

/**
 * updateURLParameter('URL 주소', '변경할 파라미터명', '변경할 데이터');
 * ex) updateURLParameter('location?data=123','data', '321') -> location?data=321
 */
lib.updateURLParameter = function (url, param, paramVal) {
  var newAdditionalURL = "";
  var tempArray = url.split("?");
  var baseURL = tempArray[0];
  var additionalURL = tempArray[1];
  var temp = "";
  if (additionalURL) {
    tempArray = additionalURL.split("&");
    for (var i = 0; i < tempArray.length; i++) {
      if (tempArray[i].split("=")[0] != param) {
        newAdditionalURL += temp + tempArray[i];
        temp = "&";
      }
    }
  }

  var rows_txt = temp + "" + param + "=" + paramVal;
  return baseURL + "?" + newAdditionalURL + rows_txt;
};
