let keywordItems = [];
let count = 0;
let activeVersionTab = 2;

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
const getLeftCount = async (lng, lat, onlyLeft) => {
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
const updateReservation = async (orgCode) => {
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
const getVaccine = async (keyword) => {
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

    keywordItems.push({
      index: count,
      keyword,
      interval: setInterval(async () => {
        try {
          const items = await getLeftCount(location.lng, location.lat, true);
          items.organizations.map(async (item) => {
            if (item.leftCounts) {
              try {
                await updateReservation(item.orgCode);
                const successList = $("#success-list ul");
                const contentLi = $("<li>").appendTo(successList);
                $(`<a href="https://vaccine.kakao.com/history" target="_blank">
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
                $("#success-list").removeClass("hide");
                keywordItems.map((item) => clearInterval(item.interval));
                $(".loading-position").removeClass("active");
              } catch (e) {}
            }
          });
          $(`.loading-${uniqLoading}`).toggleClass("active");
          $(`.loading-${uniqLoading}`).removeClass("error");
        } catch (e) {
          $(`.loading-${uniqLoading}`).addClass("error");
        }
      }, 40),
    });
    count++;
  }
};

const getVaccine2 = async (keyword) => {
  let keywordItem = {
    index: count,
    keyword,
    interval: undefined,
    leftInterval: undefined,
  };
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
    const leftList = await getLeftCount(location.lng, location.lat, false);
    if (!leftList.organizations.length) {
      return;
    }
    const uniqLoading = encodeURIComponent(keyword).replace(/[^A-Z]/g, "");
    let filterLeftList = leftList.organizations
      .filter((item) => item.status !== "CLOSED")
      .splice(0, 5);
    const list = $("#search-list ul");
    filterLeftList.map((item) => {
      $(`<li class="list-v2">
            <div class="org-name">${item.orgName}</div>
            <div class="address">${item.address}</div>
            <div class="loading-position loading-${uniqLoading} active"></div>
            </div>
          </li>`).appendTo(list);
    });
    keywordItem.leftInterval = setInterval(async () => {
      const leftList = await getLeftCount(location.lng, location.lat, false);
      filterLeftList = leftList.organizations
        .filter((item) => item.status !== "CLOSED")
        .splice(0, 2);
      const list = $("#search-list ul");
      list[0].innerHTML = "";
      filterLeftList.map((item) => {
        $(`<li class="list-v2">
            <div class="org-name">${item.orgName}</div>
            <div class="address">${item.address}</div>
            <div class="loading-position loading-${uniqLoading} active"></div>
          </li>`).appendTo(list);
      });
    }, 30000);

    keywordItem.interval = setInterval(async () => {
      try {
        filterLeftList.map(async (item) => {
          try {
            await updateReservation(item.orgCode);
            const successList = $("#success-list ul");
            const contentLi = $("<li>").appendTo(successList);
            $(`<a href="https://vaccine.kakao.com/history" target="_blank">
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
            $("#success-list").removeClass("hide");
            keywordItems.map((item) => clearInterval(item.interval));
            $(".loading-position").removeClass("active");
          } catch (e) {
            if (e.responseJSON.code !== "NO_VACANCY") {
              console.log(e);
            }
          }
        });
        $(`.loading-${uniqLoading}`).toggleClass("active");
        $(`.loading-${uniqLoading}`).removeClass("error");
      } catch (e) {
        $(`.loading-${uniqLoading}`).addClass("error");
      }
    }, 30);
    keywordItems.push(keywordItem);
    count++;
  }
};
const updateTab = (targetVersion) => {
  $(".version-wrap button").removeClass("active");
  $(`.version-wrap button[data-attr-id="${targetVersion}"`).addClass("active");
  activeVersionTab = targetVersion;
  if (targetVersion === 1) {
    $("#search-list .subtitle")[0].innerHTML = "검색중인 지역 ( 최대 5개 )";
  } else {
    $("#search-list .subtitle")[0].innerHTML = "예약중인 병원 ( 최대 5개 )";
  }
  $("#search-list ul")[0].innerHTML = "";
  keywordItems.map((item) => {
    clearInterval(item.leftInterval);
    clearInterval(item.interval);
  });
  keywordItems = [];
  count = 0;
};
$("#position").keypress(function (e) {
  if (e.which == 13) {
    const keyword = $("#position").val();
    if (keyword === "") return;
    $("#position").val("");
    if (keywordItems.filter((item) => item.keyword === keyword) > 0) return;
    if (keywordItems.length > 4) return;

    if (activeVersionTab === 1) {
      getVaccine(keyword);
    } else {
      getVaccine2(keyword);
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
  window.open(`https://vaccine.kakao.com/reservation/123`, "_blank");
});
$(".version-wrap button").on("click", (event) => {
  const targetVersion = parseInt($(event.target).attr("data-attr-id"));
  if (targetVersion === activeVersionTab) {
    return;
  }
  updateTab(targetVersion);
});
$(document).ready(() => {
  updateTab(activeVersionTab);
});
