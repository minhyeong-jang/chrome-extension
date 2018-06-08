$('#buyCoin').click( () => {
  // 일반호가 탭 선택
  $('#root > div > div > div.mainB > section.ty01 > div > div.leftB > article > span.cell02.tabB.type02 > div > ul > li:nth-child(1) > a')[0].click();

  // 매도 탭 선택
  $('#root > div > div > div.mainB > section.ty01 > div > div.rightB > article:nth-child(1) > span.tabB > ul > li.t3 > a')[0].click();

  // 매도 금액 선택 * div:nth-child(11) 이 일반호가 매수 첫번째
  $('#root > div > div > div.mainB > section.ty01 > div > div.leftB > article > span.askpriceB > div > div > div:nth-child(13) > table > tbody > tr:nth-child(1) > td.upB > a')[0].click();

  // 매도수량 가능 버튼 선택
  $('#root > div > div > div.mainB > section.ty01 > div > div.rightB > article:nth-child(1) > span.orderB > div > dl > dd:nth-child(4) > div > a')[0].click();

  // 매도수량 100% 선택
  $('#root > div > div > div.mainB > section.ty01 > div > div.rightB > article:nth-child(1) > span.orderB > div > dl > dd:nth-child(4) > div > ul > li:nth-child(1) > a')[0].click();

  // 매도 클릭
  $('#root > div > div > div.mainB > section.ty01 > div > div.rightB > article:nth-child(1) > span.orderB > div > ul > li.ty02 > a')[0].click();

  // 매도 확인 클릭
  $('#checkVerifMethodModal > div > section > article > span > a:nth-child(2)')[0].click();

  // 매도 완료 승인
  setTimeout( () => {
    $('#checkVerifMethodModal > div > section > article > span > a')[0].click();
  }, 200);
});

$('#sellCoin').click( () => {
  alert("TT");
});