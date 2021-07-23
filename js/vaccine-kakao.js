var getLeftCount = async (lng, lat, onlyLeft, initial = false) => {
  try {
    const res = await lib.ajaxSubmit({
      url: "https://vaccine.kakao.com/api/v2/vaccine/left_count_by_coords",
      type: "POST",
      data: JSON.stringify({
        bottomRight: { x: lng - 0.02, y: lat + 0.035 },
        onlyLeft,
        order: "latitude",
        topLeft: { x: lng + 0.02, y: lat - 0.035 },
      }),
      beforeSend: (xhr) => {
        xhr.setRequestHeader("Content-type", "application/json");
      },
    });
    const filterData = res.organizations.filter(
      (item) => item.status !== "CLOSED"
    );
    if (initial && !filterData.length) {
      showErrorMessage("검색지역의 병원이 모두 마감되었습니다.");
      return [];
    }
    showErrorMessage("");
    return filterData;
  } catch (e) {
    showErrorMessage("병원리스트 불러오기 오류");
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
    showErrorMessage("카카오 로그인/약관동의 오류");
    return;
  }
};
var updateReservation = async (orgCode) => {
  return lib.ajaxSubmit({
    url: "https://vaccine.kakao.com/api/v1/reservation",
    type: "POST",
    data: JSON.stringify({
      distance: null,
      from: "KakaoMap",
      orgCode,
      vaccineCode: "VEN00013",
    }),
    beforeSend: (xhr) => {
      xhr.setRequestHeader("Content-type", "application/json");
    },
  });
};
var renderKakaoListV1 = (keyword, uniqLoading, kakaoList) => {
  const list = $("#search-list ul");
  const content = $(`<li data-attr-id="${count}">`).appendTo(list);
  $(`<a data-toggle="collapse" href="#collapse-${count}">${keyword}
      <button class="btn-delete" data-attr-id="${count}"><i class="icon-trash"></i></button>
      <div class="loading-position loading-${uniqLoading} active"></div>
    </a>`).appendTo(content);
  content.on("click", "button", (ele) => {
    const id = ele.currentTarget.getAttribute("data-attr-id");
    const target = keywordItems.filter(
      (item) => item.index === parseInt(id)
    )[0];
    if (target) {
      clearInterval(target.interval);
    }
    keywordItems = keywordItems.filter((item) => item.index !== parseInt(id));
    $(`#search-list li[data-attr-id="${id}"]`).remove();
  });
  const collapseItem = $(
    `<div id="collapse-${count}" class="panel collapse" role="tabpanel">`
  ).appendTo(content);
  kakaoList.map((item) => {
    $(`<div class="org-item">
        <div class="org-name">${item.orgName}</div>
        <div class="address">${item.address}</div>
      </div>`).appendTo(collapseItem);
  });
};
var renderKakaoListV2 = (kakaoList) => {
  const list = $("#search-list ul");
  list[0].innerHTML = "";
  kakaoList.map((item) => {
    $(`<li class="list-v2">
        <div class="org-name">${item.orgName}</div>
        <div class="address">${item.address}</div>
        <div class="loading-position active"></div>
      </li>`).appendTo(list);
  });
};
var getVaccineKakaoV1 = async (keyword) => {
  const uniqLoading = encodeURIComponent(keyword).replace(/[^A-Z]/g, "");
  let keywordItem = {
    index: count,
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

  keywordItem.interval = setInterval(async () => {
    try {
      const items = await getLeftCount(location.lng, location.lat, true);
      items.map(async (item) => {
        if (item.leftCounts) {
          try {
            await updateReservation(item.orgCode);
            successResult(
              "https://vaccine.kakao.com/history",
              keyword,
              item.orgName
            );
          } catch (e) {}
        }
      });
      $(`.loading-${uniqLoading}`).toggleClass("active");
    } catch (e) {}
  }, 40);
  keywordItems.push(keywordItem);
  count++;
};
var getVaccineKakaoV2 = async (keyword) => {
  clearListAll();
  let keywordItem = {
    index: count,
    keyword,
    interval: undefined,
    leftInterval: undefined,
  };
  const isUser = await userCheck();
  if (!isUser) return;

  const location = await getCoords(keyword);
  if (!location) return;

  const leftList = await getLeftCount(location.lng, location.lat, false, true);
  if (!leftList) return;

  let filterLeftList = leftList.splice(0, 5);
  renderKakaoListV2(filterLeftList);

  keywordItem.leftInterval = setInterval(async () => {
    const leftList = await getLeftCount(location.lng, location.lat, false);
    filterLeftList = leftList.splice(0, 5);
    if (!filterLeftList.length) {
      clearListAll("검색지역의 병원이 모두 마감되었습니다.");
    }
    renderKakaoListV2(filterLeftList);
  }, 30000);

  keywordItem.interval = setInterval(async () => {
    try {
      $(`.loading-position`).toggleClass("active");
      Promise.all(
        filterLeftList.map(async (item) => {
          try {
            await updateReservation(item.orgCode);
            successResult(
              "https://vaccine.kakao.com/history",
              keyword,
              item.orgName
            );
          } catch (e) {}
        })
      );
    } catch (e) {}
  }, 40);
  keywordItems.push(keywordItem);
  count++;
};
