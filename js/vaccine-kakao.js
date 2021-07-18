var getLeftCount = async (lng, lat, onlyLeft) => {
  return lib.ajaxSubmit({
    url: "https://vaccine.kakao.com/api/v2/vaccine/left_count_by_coords",
    type: "POST",
    data: JSON.stringify({
      bottomRight: { x: lng - 0.02, y: lat + 0.04 },
      onlyLeft,
      order: "latitude",
      topLeft: { x: lng + 0.02, y: lat - 0.04 },
    }),
    beforeSend: (xhr) => {
      xhr.setRequestHeader("Content-type", "application/json");
    },
  });
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
var getVaccine = async (keyword) => {
  let keywordItem = {
    index: count,
    keyword,
    interval: undefined,
  };

  const location = await getCoords(keyword);
  if (!location) {
    return;
  }

  const leftList = await getLeftCount(location.lng, location.lat, false);
  if (!leftList.organizations.length) {
    return;
  }

  const uniqLoading = encodeURIComponent(keyword).replace(/[^A-Z]/g, "");
  const list = $("#search-list ul");
  const content = $(`<li data-attr-id="${count}">`).appendTo(list);
  $(`<a data-toggle="collapse" href="#collapse-${count}">${keyword}<button class="btn-delete hide" data-attr-id="${count}"><i class="icon-trash"></i></button>
        <div class="loading-position loading-${uniqLoading} active"></div>
      </a>`).appendTo(content);
  // content.on("click", "button", (ele) => {
  //   const id = ele.currentTarget.getAttribute("data-attr-id");
  //   const target = keywordItems.filter(
  //     (item) => item.index === parseInt(id)
  //   )[0];
  //   if (target) {
  //     clearInterval(target.interval);
  //   }
  //   keywordItems = keywordItems.filter((item) => item.index !== parseInt(id));
  //   $(`.vaccine-list li[data-attr-id="${id}"]`).remove();
  // });
  const collapseItem = $(
    `<div id="collapse-${count}" class="panel collapse" role="tabpanel">`
  ).appendTo(content);
  leftList.organizations.map((item) => {
    $(`<div class="org-item">
          <div class="org-name">${item.orgName}</div>
          <div class="address">${item.address}</div>
        </div>`).appendTo(collapseItem);
  });

  keywordItem.interval = setInterval(async () => {
    try {
      const items = await getLeftCount(location.lng, location.lat, false);
      items.organizations.map(async (item) => {
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

var getVaccine2 = async (keyword) => {
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
  const leftList = await getLeftCount(location.lng, location.lat, false);
  if (!leftList.organizations.length) {
    return;
  }
  let filterLeftList = leftList.organizations
    .filter((item) => item.status !== "CLOSED")
    .splice(0, 3);
  const list = $("#search-list ul");
  filterLeftList.map((item) => {
    $(`<li class="list-v2">
        <div class="org-name">${item.orgName}</div>
        <div class="address">${item.address}</div>
        <div class="loading-position active"></div>
        </div>
      </li>`).appendTo(list);
  });
  keywordItem.leftInterval = setInterval(async () => {
    const leftList = await getLeftCount(location.lng, location.lat, false);
    filterLeftList = leftList.organizations
      .filter((item) => item.status !== "CLOSED")
      .splice(0, 3);
    const list = $("#search-list ul");
    list[0].innerHTML = "";
    filterLeftList.map((item) => {
      $(`<li class="list-v2">
            <div class="org-name">${item.orgName}</div>
            <div class="address">${item.address}</div>
            <div class="loading-position active"></div>
          </li>`).appendTo(list);
    });
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
  }, 25);
  keywordItems.push(keywordItem);
  count++;
};
