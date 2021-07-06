/**
 * 날씨 정보
 */
var getWeather = () => {
  // 데이터를 전달받아 GET 전송
  let data = {
    address: $("#position").val(),
    key: "AIzaSyDDVqnsmm7TCLXzGSQhQPbADOi5NOGmuNo",
  };
  const params = lib.jsonToParameter(data);

  // 구글 geocode api
  lib.ajaxSubmit(
    "https://maps.googleapis.com/maps/api/geocode/json" + params,
    "GET",
    "",
    function (data) {
      // 값이 정상적인 경우
      if (data.status === "OK") {
        // x,y 좌표를 받아 기상청 계산식 실행 후 GET 전송
        let location = data.results[0].geometry.location;
        let url = xyToGrid(location.lat, location.lng);

        // 기상청 api
        lib.ajaxSubmit(url, "GET", "", function (data) {
          // 전달받은 값을 사이트에 출력
          let weather = $("<ul>").appendTo("#weather");
          var content, $item, wfEn;

          // 3시간 단위의 데이터를 반복
          for (var i = 0; i < $(data).find("data").length; i++) {
            $item = $($(data).find("data")[i]);
            if ($item.find("day").text() === "2") break;
            content = $("<li>").appendTo(weather);
            $("<div>" + $item.find("hour").text() + ":00</div>").appendTo(
              content
            );

            // 날씨에 따라 이미지 출력
            switch ($item.find("wfEn").text()) {
              case "Clear":
                $("<img src='img/icon_clear.png'>").appendTo(content);
                break;
              case "Partly Cloudy":
                $("<img src='img/icon_partly_cloudy.png'>").appendTo(content);
                break;
              case "Mostly Cloudy":
                $("<img src='img/icon_mostly_cloudy.png'>").appendTo(content);
                break;

              default:
                $(
                  "<div>no image ( " + $item.find("wfEn").text() + " )</div>"
                ).appendTo(content);
            }
            $("<div>" + $item.find("temp").text() + "°</div>").appendTo(
              content
            );
            $item.find("wfEn").text();
          }
        });
      } else {
        console.log("error");
      }
    }
  );
  return "오늘 8시에 비가 올 예정입니다.\n시간을 한번 확인해주세요";
};

/**
 * x,y 좌표 변환
 */
var xyToGrid = (v1, v2) => {
  let RE = 6371.00877; // 지구 반경(km)
  let GRID = 5.0; // 격자 간격(km)
  let SLAT1 = 30.0; // 투영 위도1(degree)
  let SLAT2 = 60.0; // 투영 위도2(degree)
  let OLON = 126.0; // 기준점 경도(degree)
  let OLAT = 38.0; // 기준점 위도(degree)
  let XO = 43; // 기준점 X좌표(GRID)
  let YO = 136; // 기1준점 Y좌표(GRID)

  //LCC DFS 좌표변환 ( code : "toXY"(위경도->좌표, v1:위도, v2:경도), "toLL"(좌표->위경도,v1:x, v2:y) )

  let DEGRAD = Math.PI / 180.0;
  let RADDEG = 180.0 / Math.PI;
  let re = RE / GRID;
  let slat1 = SLAT1 * DEGRAD;
  let slat2 = SLAT2 * DEGRAD;
  let olon = OLON * DEGRAD;
  let olat = OLAT * DEGRAD;

  let sn =
    Math.tan(Math.PI * 0.25 + slat2 * 0.5) /
    Math.tan(Math.PI * 0.25 + slat1 * 0.5);
  sn = Math.log(Math.cos(slat1) / Math.cos(slat2)) / Math.log(sn);
  let sf = Math.tan(Math.PI * 0.25 + slat1 * 0.5);
  sf = (Math.pow(sf, sn) * Math.cos(slat1)) / sn;
  let ro = Math.tan(Math.PI * 0.25 + olat * 0.5);
  ro = (re * sf) / Math.pow(ro, sn);

  let rs = {};
  rs["lat"] = parseInt(v1);
  rs["lng"] = parseInt(v2);

  let ra = Math.tan(Math.PI * 0.25 + v1 * DEGRAD * 0.5);
  ra = (re * sf) / Math.pow(ra, sn);

  let theta = v2 * DEGRAD - olon;
  if (theta > Math.PI) theta -= 2.0 * Math.PI;
  if (theta < -Math.PI) theta += 2.0 * Math.PI;
  theta *= sn;
  rs["x"] = Math.floor(ra * Math.sin(theta) + XO + 0.5);
  rs["y"] = Math.floor(ro - ra * Math.cos(theta) + YO + 0.5);
  return (
    "http://www.kma.go.kr/wid/queryDFS.jsp?gridx=" +
    rs["x"] +
    "&gridy=" +
    rs["y"]
  );
};

/**
 * 앱 로딩 후
 */
(function () {
  "use strict";
  const alarmName = "weatherAlarm";

  // init
  parent.getWeather();

  // 날짜 알람 설정 이벤트
  $(`#${alarmName}`).click(() => {
    // 해당 알람 정보 수집
    chrome.alarms.get(alarmName, (alrams) => {
      if (alrams) {
        // 알람 삭제
        chrome.alarms.clear(alarmName);
        console.log("clear");
      } else {
        // 알람 생성
        chrome.alarms.create(alarmName, {
          when: Date.now(),
          periodInMinutes: 0.1,
        });
      }
    });
  });
})();
