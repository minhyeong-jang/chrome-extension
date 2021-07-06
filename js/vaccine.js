/**
 * 검색버튼 클릭
 */
$("#position").keypress(function (e) {
  if (e.which == 13) {
    getVaccine(); // 실행할 이벤트
  }
});
$("button.search").on("click", () => {
  getVaccine();
});

/**
 * 날씨 정보
 */
var getVaccine = () => {
  const keyword = $("#position").val();
  // 데이터를 전달받아 GET 전송
  let data = {
    address: keyword,
    key: "AIzaSyDDVqnsmm7TCLXzGSQhQPbADOi5NOGmuNo",
  };
  const params = lib.jsonToParameter(data);

  // 구글 geocode api
  lib.ajaxSubmit(
    "https://maps.googleapis.com/maps/api/geocode/json" + params,
    "GET",
    "",
    (data) => {
      if (data.status === "OK") {
        const location = data.results[0].geometry.location;

        let list = $("<ul>").appendTo(".vaccine-list");
        let content = $("<li>").appendTo(list);

        $(`<div>${keyword}</div>`).appendTo(content);

        const interval = setInterval(() => {
          var xhr = new XMLHttpRequest();
          xhr.open(
            "POST",
            "https://vaccine.kakao.com/api/v2/vaccine/left_count_by_coords",
            true
          );
          xhr.setRequestHeader("Content-Type", "application/json");
          xhr.onload = function () {
            if (xhr.status === 200 || xhr.status === 201) {
              console.log(`${keyword} 검색어 주변 확인 중..`);
              JSON.parse(xhr.responseText).organizations.map((item) => {
                if (item.leftCounts) {
                  console.log(
                    `interval : https://vaccine.kakao.com/reservation/${item.orgCode}?from=KakaoMap&code=VEN00013`
                  );
                  soundManager.onready(() => {
                    soundManager.createSound({
                      id: "mySound",
                      url: "/doorbell.wav",
                    });
                    soundManager.play("mySound");
                  });
                  window.open(
                    `https://vaccine.kakao.com/reservation/${item.orgCode}?from=KakaoMap&code=VEN00013`,
                    "_blank"
                  );
                }
              });
            } else {
              console.error(xhr.responseText);
            }
          };
          xhr.send(
            JSON.stringify({
              bottomRight: { x: location.lng - 0.03, y: location.lat + 0.3 },
              onlyLeft: false,
              order: "latitude",
              topLeft: { x: location.lng + 0.03, y: location.lat - 0.3 },
            })
          );
        }, 1000);
      }
    }
  );
};
