var activeVersionTab = 2;
var keywordItems = [];
var count = 0;

var getCoords = async (keyword) => {
  try {
    const params = lib.jsonToParameter({
      address: keyword,
      key: "AIzaSyDZA26I8PeyF2qijfAwtkBTyRBamKq4uxE",
    });
    const res = await lib.ajaxSubmit({
      url: "https://maps.googleapis.com/maps/api/geocode/json" + params,
      type: "GET",
    });

    if (res.status === "OK") {
      const location = res.results[0].geometry.location;
      if (
        location.lat < 33 ||
        location.lat > 43 ||
        location.lng < 124 ||
        location.lng > 132
      ) {
        return;
      }
      return { lat: location.lat, lng: location.lng };
    }
    return;
  } catch (e) {
    $(".error-message")[0].innerHTML = "위치정보 불러오기 오류";
    return;
  }
};
var successResult = (url, keyword, orgName) => {
  const successList = $("#success-list ul");
  const contentLi = $("<li>").appendTo(successList);
  $(`<a href="${url}" target="_blank">
      ${keyword} : ${orgName}
    </a>`).appendTo(contentLi);
  keywordItems.map((item) => {
    clearInterval(item.interval);
    clearInterval(item.leftInterval);
  });
  $("#success-list").removeClass("hide");
  $(".loading-position").removeClass("active");
  soundManager.onready(() => {
    soundManager.createSound({
      id: "mySound",
      url: "/doorbell.wav",
      volume: 30,
    });
    soundManager.play("mySound");
  });
};

var updateTab = (targetVersion) => {
  $(".version-wrap button").removeClass("active");
  $(`.version-wrap button[data-attr-id="${targetVersion}"`).addClass("active");
  activeVersionTab = targetVersion;
  if (targetVersion === 1) {
    $("#search-list .subtitle")[0].innerHTML = "검색중인 지역 ( 최대 5개 )";
  } else if (targetVersion === 2) {
    $("#search-list .subtitle")[0].innerHTML = "예약중인 병원 ( 최대 3개 )";
  } else if (targetVersion === 3) {
    $("#search-list .subtitle")[0].innerHTML = "예약중인 병원 ( 최대 3개 )";
  }
  $("#search-list ul")[0].innerHTML = "";
  $(".error-message")[0].innerHTML = "";
  keywordItems.map((item) => {
    clearInterval(item.leftInterval);
    clearInterval(item.interval);
  });
  keywordItems = [];
  count = 0;
};

$(document).ready(() => {
  updateTab(activeVersionTab);
});
$("#position").keypress(function (e) {
  if (e.which == 13) {
    const keyword = $("#position").val();
    if (keyword === "") return;
    $("#position").val("");
    if (keywordItems.filter((item) => item.keyword === keyword) > 0) return;
    if (keywordItems.length > 4) return;

    if (activeVersionTab === 1) {
      getVaccine(keyword);
    } else if (activeVersionTab === 2) {
      getVaccine2(keyword);
    } else if (activeVersionTab === 3) {
      getVaccineNaver(keyword);
    }
  }
});
$("button.popup-info").on("click", () => {
  window.open(
    `https://www.notion.so/Kakao-Vaccine-984167bec4b944cfa10200aee5fd18b7`,
    "_blank"
  );
});
$("button.popup-test").on("click", () => {
  if (activeVersionTab === 3) {
    window.open(
      `https://v-search.nid.naver.com/reservation?orgCd=11101288&sid=12072198`
    );
  } else {
    window.open(`https://vaccine.kakao.com/reservation/123`, "_blank");
  }
});
$(".version-wrap button").on("click", (event) => {
  const targetVersion = parseInt($(event.target).attr("data-attr-id"));
  if (targetVersion === activeVersionTab) {
    return;
  }
  updateTab(targetVersion);
});
