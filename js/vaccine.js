/**
 * 검색 버튼 클릭
 */
$("#position").keypress(function (e) {
  if (e.which == 13) {
    getVaccine(); // 실행할 이벤트
  }
});
$("button.search").on("click", () => {
  getVaccine();
});
$("button.popup-test").on("click", () => {
  window.open(
    `https://vaccine.kakao.com/reservation/123?from=KakaoMap&code=VEN00013`,
    "_blank"
  );
});

/**
 * 백신 정보
 */
let keywordItems = {};
let collapseCount = 0;

const getVaccine = () => {
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
        if (keywordItems[keyword]) return;

        const location = data.results[0].geometry.location;
        const list = $(".vaccine-list");
        const content = $("<li>").appendTo(list);
        $(
          `<a data-toggle="collapse" href="#collapse-${collapseCount}">${keyword} 주변 확인 중<div class="loading-position loading-${btoa(
            unescape(encodeURIComponent(keyword))
          )} active"></div></a>`
        ).appendTo(content);
        const collapseItem = $(
          `<div id="collapse-${collapseCount}" class="panel collapse" role="tabpanel">`
        ).appendTo(content);

        setInterval(() => {
          var xhr = new XMLHttpRequest();
          xhr.open(
            "POST",
            "https://vaccine.kakao.com/api/v2/vaccine/left_count_by_coords",
            true
          );
          xhr.setRequestHeader("Content-Type", "application/json");
          xhr.onload = () => {
            if (xhr.status === 200 || xhr.status === 201) {
              $(
                `.loading-${btoa(unescape(encodeURIComponent(keyword)))}`
              ).toggleClass("active");

              JSON.parse(xhr.responseText).organizations.map((item) => {
                if (!keywordItems[keyword]) {
                  $(
                    `<div class="org-item"><div class="org-name">${item.orgName}</div><div class="address">${item.address}</div></div>`
                  ).appendTo(collapseItem);
                }
                if (item.leftCounts) {
                  console.log(
                    `성공했어요 : https://vaccine.kakao.com/reservation/${item.orgCode}?from=KakaoMap&code=VEN00013`
                  );
                  const successList = $(".success-list");
                  const contentLi = $("<li>").appendTo(successList);
                  $(
                    `<a href="${`https://vaccine.kakao.com/reservation/${item.orgCode}?from=KakaoMap&code=VEN00013`}" target="_blank">${keyword} : ${
                      item.orgName
                    }</a>`
                  ).appendTo(contentLi);

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
              keywordItems[keyword] = true;
            } else {
              console.error(xhr.responseText);
            }
          };
          xhr.send(
            JSON.stringify({
              bottomRight: { x: location.lng - 0.01, y: location.lat + 0.02 },
              onlyLeft: false,
              order: "latitude",
              topLeft: { x: location.lng + 0.01, y: location.lat - 0.02 },
            })
          );
        }, 1000);
        collapseCount++;
      }
    }
  );
};
