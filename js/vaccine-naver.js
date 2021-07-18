var getNaverList = async (location) => {
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
    return res[0].data.rests.businesses.items
      .filter((item) => parseFloat(item.distance) <= 3)
      .splice(0, 3);
  } catch (e) {
    $(".error-message")[0].innerHTML = "병원리스트 불러오기 오류";
    return;
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
    return false;
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
var getVaccineNaver = async (keyword) => {
  let keywordItem = {
    index: count,
    keyword,
    interval: undefined,
    leftInterval: undefined,
  };

  const location = await getCoords(keyword);
  if (!location) {
    return;
  }
  const naverList = await getNaverList(location);
  if (!naverList || !naverList.length) {
    return;
  }
  const list = $("#search-list ul");
  naverList.map((item) => {
    $(`<li class="list-v2">
        <div class="org-name">${item.name}</div>
        <div class="address">${item.roadAddress}</div>
        <div class="loading-position active"></div>
        </div>
      </li>`).appendTo(list);
  });
  keywordItem.interval = setInterval(async () => {
    $(`.loading-position`).toggleClass("active");

    const reservatonList = await Promise.all(
      naverList.map(async (item) => ({
        code: await getReservationKey(
          item.vaccineQuantity.vaccineOrganizationCode,
          item.id
        ),
        orgName: item.name,
      }))
    );
    if (reservatonList.filter((reservation) => !reservation.code).length) {
      $(".error-message")[0].innerHTML = "병원 정보 불러오기 오류";
      return;
    }
    Promise.all(
      reservatonList.map(async (reservation) => {
        try {
          const res = await checkReservation(reservation.code);
          if (toUpperCase(res.code) === "SUCCESS") {
            successResult(
              `https://v-search.nid.naver.com/reservation/success?key=ezEUx4DJn4cZ6o1`,
              keyword,
              reservatonList[successIndex].orgName
            );
          }
        } catch (e) {}
      })
    );
  }, 100);
  keywordItems.push(keywordItem);
};
