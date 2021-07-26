var getNaverList = async (location, initial = false) => {
  try {
    const res = await lib.ajaxSubmit({
      url: "https://api.place.naver.com/graphql",
      type: "POST",
      beforeSend: (xhr) => {
        xhr.setRequestHeader("Content-type", "application/json");
      },
      data: JSON.stringify([
        {
          operationName: "vaccineList",
          query:
            "query vaccineList($input: RestsInput, $businessesInput: RestsBusinessesInput, $isNmap: Boolean!, $isBounds: Boolean!) {\n  rests(input: $input) {\n    businesses(input: $businessesInput) {\n      total\n      vaccineLastSave\n      isUpdateDelayed\n      items {\n        id\n        name\n        dbType\n        phone\n        virtualPhone\n        hasBooking\n        hasNPay\n        bookingReviewCount\n        description\n        distance\n        commonAddress\n        roadAddress\n        address\n        imageUrl\n        imageCount\n        tags\n        distance\n        promotionTitle\n        category\n        routeUrl\n        businessHours\n        x\n        y\n        imageMarker @include(if: $isNmap) {\n          marker\n          markerSelected\n          __typename\n        }\n        markerLabel @include(if: $isNmap) {\n          text\n          style\n          __typename\n        }\n        isDelivery\n        isTakeOut\n        isPreOrder\n        isTableOrder\n        naverBookingCategory\n        bookingDisplayName\n        bookingBusinessId\n        bookingVisitId\n        bookingPickupId\n        vaccineOpeningHour {\n          isDayOff\n          standardTime\n          __typename\n        }\n        vaccineQuantity {\n          totalQuantity\n          totalQuantityStatus\n          startTime\n          endTime\n          vaccineOrganizationCode\n          list {\n            quantity\n            quantityStatus\n            vaccineType\n            __typename\n          }\n          __typename\n        }\n        __typename\n      }\n      optionsForMap @include(if: $isBounds) {\n        maxZoom\n        minZoom\n        includeMyLocation\n        maxIncludePoiCount\n        center\n        __typename\n      }\n      __typename\n    }\n    queryResult {\n      keyword\n      vaccineFilter\n      categories\n      region\n      isBrandList\n      filterBooking\n      hasNearQuery\n      isPublicMask\n      __typename\n    }\n    __typename\n  }\n}\n",
          variables: {
            businessesInput: {
              start: 0,
              display: 100,
              deviceType: "mobile",
              sortingOrder: "distance",
              x: location.lng.toFixed(14),
              y: location.lat.toFixed(14),
            },
            input: {
              keyword: "코로나백신위탁의료기관",
              x: location.lng.toFixed(14),
              y: location.lat.toFixed(14),
            },
            isBounds: false,
            isNmap: false,
          },
        },
      ]),
    });
    const items = res[0].data.rests.businesses.items;
    const sortedItems = items
      .sort((a, b) => {
        let aDistance = parseFloat(a.distance);
        let bDistance = parseFloat(b.distance);
        if (a.distance.match(/\dm/)) {
          aDistance = parseFloat(a.distance) / 1000;
        }
        if (b.distance.match(/\dm/)) {
          bDistance = parseFloat(b.distance) / 1000;
        }
        return aDistance - bDistance;
      })
      .filter(
        (item) =>
          parseFloat(item.distance) <= 4 &&
          item.vaccineQuantity &&
          item.vaccineQuantity.totalQuantityStatus !== "empty" &&
          item.vaccineQuantity.totalQuantityStatus !== "closed"
      );
    if (!sortedItems.length && initial) {
      showErrorMessage("naver", "검색지역의 병원이 모두 마감되었습니다.");
      return [];
    }
    return sortedItems;
  } catch (e) {
    // showErrorMessage("naver", "병원리스트 불러오기 오류");
    return [];
  }
};
var getReservationKey = async (cd, id) => {
  try {
    const res = await lib.ajaxSubmit({
      url: `https://v-search.nid.naver.com/reservation?orgCd=${cd}&sid=${id}`,
      type: "GET",
    });
    const regexp = /\<input type=\"hidden\" id=\"key\" value=\"([^\"]*)\"\/\>/;
    return res.match(regexp)[1];
  } catch (e) {
    return;
  }
};
var checkReservation = async (key) => {
  return lib.ajaxSubmit({
    url: `https://v-search.nid.naver.com/reservation/check?key=${key}`,
    type: "POST",
    beforeSend: (xhr) => {
      xhr.setRequestHeader("Content-type", "application/json");
    },
    data: JSON.stringify({ key }),
  });
};
var renderNaverListV1 = (keyword, uniqLoading, naverList) => {
  const list = $("#naver-list ul");
  const content = $(`<li>`).appendTo(list);
  $(`<a data-toggle="collapse" href="#collapse-naver-${uniqLoading}">${keyword}
      <div class="loading-position loading-${uniqLoading} active"></div>
    </a>`).appendTo(content);
  const collapseItem = $(
    `<div id="collapse-naver-${uniqLoading}" class="panel collapse" role="tabpanel">`
  ).appendTo(content);
  naverList.map((item) => {
    $(`<div class="org-item">
        <div class="org-name">${item.name}</div>
        <div class="address">${item.roadAddress}</div>
      </div>`).appendTo(collapseItem);
  });
};

var getVaccineNaverV1 = async (keyword) => {
  const uniqLoading = encodeURIComponent(`NAVER-${keyword}`).replace(
    /[^A-Z]/g,
    ""
  );
  let keywordItem = {
    keyword,
    interval: undefined,
  };

  const location = await getCoords(keyword);
  if (!location) return;

  const naverList = await getNaverList(location, true);
  if (!naverList.length) return;

  const userCheck = await getReservationKey(
    naverList[0].vaccineQuantity.vaccineOrganizationCode,
    naverList[0].id
  );
  if (!userCheck) {
    showErrorMessage("naver", "네이버 로그인/인증서 오류");
    return;
  }
  renderNaverListV1(keyword, uniqLoading, naverList);

  keywordItem.interval = setInterval(async () => {
    const naverList = await getNaverList(location);
    naverList.map(async (item) => {
      try {
        if (item.vaccineQuantity.totalQuantity) {
          const code = await getReservationKey(
            item.vaccineQuantity.vaccineOrganizationCode,
            item.id
          );
          if (!code) {
            // showErrorMessage("naver", "코드발급 오류");
            return;
          }
          const res = await checkReservation(code);
          if (toUpperCase(res.code) === "SUCCESS") {
            successResult(
              `https://v-search.nid.naver.com/reservation/success?key=${reservation.code}`,
              keyword,
              item.name
            );
          }
        }
      } catch (e) {}
    });
    $(`.loading-${uniqLoading}`).toggleClass("active");
  }, 800);
  keywordItems.push(keywordItem);
};

// var renderNaverListV2 = (naverList) => {
//   const list = $("#search-list ul");
//   list[0].innerHTML = "";
//   naverList.map((item) => {
//     $(`<li class="list-v2">
//         <div class="org-name">${item.name}</div>
//         <div class="address">${item.roadAddress}</div>
//         <div class="loading-position active"></div>
//         </div>
//       </li>`).appendTo(list);
//   });
// };
// var getVaccineNaverV2 = async (keyword) => {
//   clearListAll();
//   let keywordItem = {
//     index: count,
//     keyword,
//     interval: undefined,
//     leftInterval: undefined,
//   };

//   const location = await getCoords(keyword);
//   if (!location) return;

//   const naverList = await getNaverList(location);
//   if (!naverList.length) {
//     showErrorMessage("naver", "검색지역의 병원이 모두 마감되었습니다.");
//     return;
//   }
//   let filterNaverList = naverList.splice(0, 3);

//   const userCheck = await getReservationKey(
//     naverList[0].vaccineQuantity.vaccineOrganizationCode,
//     naverList[0].id
//   );
//   if (!userCheck) {
//     showErrorMessage("naver", "네이버 로그인/인증서 오류");
//     return;
//   }

//   renderNaverListV2(naverList);
//   keywordItem.leftInterval = setInterval(async () => {
//     const naverList = await getNaverList(location);
//     if (!naverList.length) {
//       clearListAll("검색지역의 병원이 모두 마감되었습니다.");
//     }
//     filterNaverList = naverList.splice(0, 3);
//     renderNaverListV2(naverList);
//   }, 30000);
//   keywordItem.interval = setInterval(async () => {
//     $(`.loading-position`).toggleClass("active");

//     const reservatonList = await Promise.all(
//       naverList.map(async (item) => ({
//         code: await getReservationKey(
//           item.vaccineQuantity.vaccineOrganizationCode,
//           item.id
//         ),
//         orgName: item.name,
//       }))
//     );
//     const filterReservationList = reservatonList.filter(
//       (reservation) => reservation.code
//     );
//     if (!filterReservationList.length) {
//       $(".error-message")[0].innerHTML = "병원 정보 불러오기 오류";
//       return;
//     }
//     Promise.all(
//       filterReservationList.map(async (reservation) => {
//         try {
//           const res = await checkReservation(reservation.code);
//           if (toUpperCase(res.code) === "SUCCESS") {
//             successResult(
//               `https://v-search.nid.naver.com/reservation/success?key=${reservation.code}`,
//               keyword,
//               reservation.orgName
//             );
//           }
//         } catch (e) {}
//       })
//     );
//     $(".error-message")[0].innerHTML = "";
//   }, 300);
//   keywordItems.push(keywordItem);
// };
