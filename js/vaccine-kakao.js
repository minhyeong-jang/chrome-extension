let kakaoResTime = 125;

const kakaoCode = {
  /** 화이자 */
  pfizer: "VEN00013",
  /** 모더나 */
  moderna: "VEN00014",
};
/** 아스트라제네카 */
// const VEN00015 = 'VEN00015',
/** 얀센 */
// const VEN00016 = 'VEN00016',
/** 노바백스 */
// const VEN00017 = 'VEN00017',
/** 시노팜 */
// const VEN00018 = 'VEN00018',
/** 시노백 */
// const VEN00019 = 'VEN00019',
/** 스푸트니크V */
// const VEN00020 = 'VEN00020'

var getLeftCount = async (lng, lat, onlyLeft, initial = false) => {
  try {
    const startTime = new Date().getTime();
    const res = await lib.ajaxSubmit({
      url: "https://vaccine.kakao.com/api/v2/vaccine/left_count_by_coords",
      type: "POST",
      data: JSON.stringify({
        bottomRight: { x: lng - 0.01, y: lat + 0.02 },
        onlyLeft,
        order: "latitude",
        topLeft: { x: lng + 0.01, y: lat - 0.02 },
      }),
      beforeSend: (xhr) => {
        xhr.setRequestHeader("Content-type", "application/json");
      },
    });
    kakaoResTime = new Date().getTime() - startTime;
    setCallTime("kakao", kakaoResTime);
    const filterData = res.organizations.filter(
      (item) => item.status !== "CLOSED"
    );
    if (initial && !filterData.length) {
      showErrorMessage("kakao", "검색지역의 병원이 모두 마감되었습니다.");
      return [];
    }
    showErrorMessage("kakao", "");
    return filterData;
  } catch (e) {
    showErrorMessage("kakao", "질병관리청 네트워크 문제 발생");
    return [];
  }
};
var userCheck = async () => {
  try {
    await lib.ajaxSubmit({
      url: "https://vaccine.kakao.com/api/v1/user",
      type: "GET",
      beforeSend: (xhr) => {
        xhr.setRequestHeader("Content-type", "application/json");
      },
    });
    return true;
  } catch (e) {
    showErrorMessage("kakao", "카카오 로그인/약관동의 오류");
    return;
  }
};
var updateReservation = async (orgCode, vaccineCode) => {
  return lib.ajaxSubmit({
    url: "https://vaccine.kakao.com/api/v1/reservation",
    type: "POST",
    data: JSON.stringify({
      distance: null,
      from: "KakaoMap",
      orgCode,
      vaccineCode,
    }),
    beforeSend: (xhr) => {
      xhr.setRequestHeader("Content-type", "application/json");
    },
  });
};
var renderKakaoListV1 = (keyword, uniqLoading, kakaoList) => {
  const list = $("#kakao-list ul");
  const content = $(`<li>`).appendTo(list);
  $(`<a data-toggle="collapse" href="#collapse-${uniqLoading}">${keyword}
      <div class="loading-position loading-${uniqLoading} active"></div>
    </a>`).appendTo(content);
  const collapseItem = $(
    `<div id="collapse-${uniqLoading}" class="panel collapse" role="tabpanel">`
  ).appendTo(content);
  kakaoList.map((item) => {
    $(`<div class="org-item">
        <div class="org-name">${item.orgName}</div>
        <div class="address">${item.address}</div>
      </div>`).appendTo(collapseItem);
  });
};
var getVaccineKakaoV1 = async (keyword) => {
  const uniqLoading = encodeURIComponent(keyword).replace(/[^A-Z]/g, "");
  let keywordItem = {
    keyword,
    interval: undefined,
  };

  const isUser = await userCheck();
  if (!isUser) return;

  const location = await getCoords(keyword);
  if (!location) return;

  const leftList = await getLeftCount(location.lng, location.lat, false, true);
  if (!leftList.length) return;

  renderKakaoListV1(keyword, uniqLoading, leftList);

  const vaccineRequest = async () => {
    try {
      const items = await getLeftCount(location.lng, location.lat, true);
      items.map((item) => {
        if (item.leftCounts) {
          Promise.all(
            vaccineType.map(async (type) => {
              try {
                await updateReservation(item.orgCode, kakaoCode[type]);
                successResult(
                  "https://vaccine.kakao.com/history",
                  keyword,
                  item.orgName
                );
              } catch (e) {}
            })
          );
        }
      });
      $(`.loading-${uniqLoading}`).toggleClass("active");
    } catch (e) {}

    setTimeout(
      () => !isSuccess && vaccineRequest(),
      kakaoResTime * 0.5 > 125 ? kakaoResTime * 0.5 : 125
    );
  };
  vaccineRequest();
  keywordItems.push(keywordItem);
};

// var renderKakaoListV2 = (kakaoList) => {
//   const list = $("#search-list ul");
//   list[0].innerHTML = "";
//   kakaoList.map((item) => {
//     $(`<li class="list-v2">
//         <div class="org-name">${item.orgName}</div>
//         <div class="address">${item.address}</div>
//         <div class="loading-position active"></div>
//       </li>`).appendTo(list);
//   });
// };
// var getVaccineKakaoV2 = async (keyword) => {
//   clearListAll();
//   let keywordItem = {
//     index: count,
//     keyword,
//     interval: undefined,
//     leftInterval: undefined,
//   };
//   const isUser = await userCheck();
//   if (!isUser) return;

//   const location = await getCoords(keyword);
//   if (!location) return;

//   const leftList = await getLeftCount(location.lng, location.lat, false, true);
//   if (!leftList) return;

//   let filterLeftList = leftList.splice(0, 5);
//   renderKakaoListV2(filterLeftList);

//   keywordItem.leftInterval = setInterval(async () => {
//     const leftList = await getLeftCount(location.lng, location.lat, false);
//     filterLeftList = leftList.splice(0, 5);
//     if (!filterLeftList.length) {
//       clearListAll("검색지역의 병원이 모두 마감되었습니다.");
//     }
//     renderKakaoListV2(filterLeftList);
//   }, 30000);

//   keywordItem.interval = setInterval(async () => {
//     try {
//       $(`.loading-position`).toggleClass("active");
//       Promise.all(
//         filterLeftList.map(async (item) => {
//           try {
//             await updateReservation(item.orgCode);
//             successResult(
//               "https://vaccine.kakao.com/history",
//               keyword,
//               item.orgName
//             );
//           } catch (e) {}
//         })
//       );
//     } catch (e) {}
//   }, 40);
//   keywordItems.push(keywordItem);
//   count++;
// };
