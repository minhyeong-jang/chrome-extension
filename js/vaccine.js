$("#position").keypress(function (e) {
  if (e.which == 13) {
    getVaccine();
  }
});
$("button.search").on("click", () => {
  getVaccine();
});
$("button.popup-test").on("click", () => {
  window.open(`https://vaccine.kakao.com/reservation/123`, "_blank");
});

let keywordItems = {};
let count = 0;

const getCoords = async (keyword) => {
  const params = lib.jsonToParameter({
    address: keyword,
    key: "AIzaSyDZA26I8PeyF2qijfAwtkBTyRBamKq4uxE",
  });
  return lib.ajaxSubmit({
    url: "https://maps.googleapis.com/maps/api/geocode/json" + params,
    type: "GET",
  });
};
const getLeftCount = async (lng, lat) => {
  return lib.ajaxSubmit({
    url: "https://vaccine.kakao.com/api/v2/vaccine/left_count_by_coords",
    type: "POST",
    data: JSON.stringify({
      bottomRight: { x: lng - 0.01, y: lat + 0.02 },
      onlyLeft: false,
      order: "latitude",
      topLeft: { x: lng + 0.01, y: lat - 0.02 },
    }),
    beforeSend: (xhr) => {
      xhr.setRequestHeader("Content-type", "application/json");
    },
  });
};
const getVaccine = async () => {
  const keyword = $("#position").val();
  $("#position").val("");
  if (keywordItems[keyword]) return;
  if (Object.keys(keywordItems).length > 4) return;

  const coords = await getCoords(keyword);
  if (coords.status === "OK") {
    const location = coords.results[0].geometry.location;
    if (
      location.lat < 33 ||
      location.lat > 43 ||
      location.lng < 124 ||
      location.lng > 132
    ) {
      return;
    }
    const leftList = await getLeftCount(location.lng, location.lat);
    if (!leftList.organizations.length) {
      return;
    }
    keywordItems[keyword] = true;

    const list = $(".vaccine-list");
    const content = $("<li>").appendTo(list);
    $(`<a data-toggle="collapse" href="#collapse-${count}">
        ${keyword} 주변 확인 중
        <div class="loading-position loading-${count} active"></div>
      </a>`).appendTo(content);
    const collapseItem = $(
      `<div id="collapse-${count}" class="panel collapse" role="tabpanel">`
    ).appendTo(content);
    leftList.organizations.map((item) => {
      $(`<div class="org-item">
          <div class="org-name">${item.orgName}</div>
          <div class="address">${item.address}</div>
        </div>`).appendTo(collapseItem);
    });

    setInterval(async () => {
      try {
        const items = await getLeftCount(location.lng, location.lat);
        $(`.loading-${count}`).toggleClass("active");
        items.organizations.map((item) => {
          if (item.leftCounts) {
            const successList = $(".success-list");
            const contentLi = $("<li>").appendTo(successList);
            $(`<a href="${`https://vaccine.kakao.com/reservation/${item.orgCode}`}" target="_blank">
                ${keyword} : ${item.orgName}
              </a>`).appendTo(contentLi);

            soundManager.onready(() => {
              soundManager.createSound({
                id: "mySound",
                url: "/doorbell.wav",
                volume: 30,
              });
              soundManager.play("mySound");
            });
            window.open(
              `https://vaccine.kakao.com/reservation/${item.orgCode}?from=KakaoMap&code=VEN00013`,
              "_blank"
            );
          }
        });
      } catch (e) {
        $(`.loading-${count}`).toggleClass("error");
      }
    }, 1000);
    count++;
  }
};
