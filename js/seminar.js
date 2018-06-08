/**
 * Alrams 리스트 체크
 */
chrome.alarms.getAll(function(alrams) {
  console.log(alrams);
  for(var i=0; i<alrams.length; i++){
    $(`#${alrams[i].name}`).attr('checked', true);
  }
});


/**
 * 백그라운드 색상 변경
 */
$('button').on('click', () => {
  console.log('Turning Background red!');
  // chrome.tabs.executeScript({
  //   code: 'document.body.style.backgroundColor="red"'
  // }, );

  console.log(`$('<td><input type='checkbox'></td>').appendTo('tr')`);
  chrome.tabs.executeScript({
    // chrome.tabs.executeScript(null, { file: "content.js" });
    code: `$('<td><input type="checkbox"></td>').appendTo('tr')`
  });
  
  // chrome.tabs.executeScript({
  //   code: "document.querySelector('#hdtb-msb-vis > div:nth-child(1) > a').click();"
  // });
});

/**
 * 알람 상태 변경 이벤트
 */
$('.radio-alram').on('change', () => {
  // soundManager.onready(() => {
  //   soundManager.createSound({
  //     id: 'mySound',
  //     url: '/doorbell.wav'
  //   });
  //   soundManager.play('mySound');
  // });
});