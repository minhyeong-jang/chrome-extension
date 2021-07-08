$("#position").keypress(function (e) {
  if (e.which == 13) {
    getVaccine();
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

let keywordItems = {};
let collapseCount = 0;

const getVaccine = () => {
  const keyword = $("#position").val();
  $("#position").val("");
  if (keywordItems[keyword]) return;

  const params = lib.jsonToParameter({
    address: keyword,
    key: "AIzaSyDDVqnsmm7TCLXzGSQhQPbADOi5NOGmuNo",
  });

  lib.ajaxSubmit({
    url: "https://maps.googleapis.com/maps/api/geocode/json" + params,
    type: "GET",
    callback: (data) => {
      if (data.status === "OK") {
        const loadingKeyword = btoa(
          unescape(encodeURIComponent(keyword))
        ).replace(/[^a-zA-Z]/g, "");

        const location = data.results[0].geometry.location;
        const list = $(".vaccine-list");
        const content = $("<li>").appendTo(list);
        $(
          `<a data-toggle="collapse" href="#collapse-${collapseCount}">${keyword} 주변 확인 중<div class="loading-position loading-${loadingKeyword} active"></div></a>`
        ).appendTo(content);
        const collapseItem = $(
          `<div id="collapse-${collapseCount}" class="panel collapse" role="tabpanel">`
        ).appendTo(content);

        setInterval(() => {
          lib.ajaxSubmit({
            url: "https://vaccine.kakao.com/api/v2/vaccine/left_count_by_coords",
            type: "POST",
            data: JSON.stringify({
              bottomRight: { x: location.lng - 0.01, y: location.lat + 0.02 },
              onlyLeft: false,
              order: "latitude",
              topLeft: { x: location.lng + 0.01, y: location.lat - 0.02 },
            }),
            beforeSend: (xhr) => {
              xhr.setRequestHeader("Content-type", "application/json");
            },
            callback: (data) => {
              try {
                $(`.loading-${loadingKeyword}`).toggleClass("active");
                data.organizations.map((item) => {
                  if (!keywordItems[keyword]) {
                    $(
                      `<div class="org-item"><div class="org-name">${item.orgName}</div><div class="address">${item.address}</div></div>`
                    ).appendTo(collapseItem);
                  }
                  if (item.leftCounts) {
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
              } catch (e) {
                $(`.loading-${loadingKeyword}`).toggleClass("error");
              }
            },
          });
        }, 1000);
        collapseCount++;
      }
    },
  });
};
