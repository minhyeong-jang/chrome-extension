var activeVersionTab = 1;
var keywordItems = [];
var isSuccess = false;
var vaccineType = ["pfizer", "moderna"];

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
        showErrorMessage("kakao", "검색되지 않는 지역입니다.");
        showErrorMessage("naver", "검색되지 않는 지역입니다.");
        return;
      }
      return { lat: location.lat, lng: location.lng };
    } else {
      showErrorMessage("kakao", "검색되지 않는 지역입니다.");
      showErrorMessage("naver", "검색되지 않는 지역입니다.");
    }
    return;
  } catch (e) {
    showErrorMessage("kakao", "위치정보 불러오기 오류");
    showErrorMessage("naver", "위치정보 불러오기 오류");
    return;
  }
};
var successResult = (url, keyword, orgName) => {
  const successList = $("#success-list");
  $(`<a href="${url}" target="_blank">
      ${keyword} : ${orgName}
    </a>`).appendTo(successList);

  showErrorMessage("naver", "");
  showErrorMessage("kakao", "");

  isSuccess = true;

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
var showErrorMessage = (type, message = "") => {
  const typeId = type === "kakao" ? "kakao-list" : "naver-list";
  $(`#${typeId} .error-message`)[0].innerHTML = message;
};
var setCallTime = (type, time) => {
  const typeId = type === "kakao" ? "kakao-list" : "naver-list";
  $(`#${typeId} .call-time`)[0].innerHTML = `${(
    time / 1000
  ).toLocaleString()}sec`;
};

$("#position").keypress(function (e) {
  if (e.which == 13) {
    const keyword = $("#position").val();
    if (keyword === "") return;
    $("#position").val("");
    if (keywordItems.filter((item) => item.keyword === keyword) > 0) return;
    if (keywordItems.length > 3) return;

    getVaccineKakaoV1(keyword);
    getVaccineNaverV1(keyword);
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
$("#vaccine-type input").on("change", (event) => {
  const value = event.currentTarget.value;
  const index = vaccineType.indexOf(value);
  if (index === -1) {
    vaccineType.push(value);
  } else {
    vaccineType.splice(index, 1);
  }
});
