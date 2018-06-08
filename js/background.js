/**
 * Listens for the app launching then creates the window
 *
 * @see http://developer.chrome.com/apps/app.window.html
 */
// chrome.app.runtime.onLaunched.addListener(function() {
//   chrome.app.window.create('index.html', {
//     id: 'main',
//     bounds: { width: 620, height: 500 }
//   });
// });

chrome.alarms.onAlarm.addListener((alarm) => {
  console.log("Got an alarm!", alarm);
  showNotification(alarm);
});

var showNotification = (data) => {
  var noti = {};
  switch (data.name){
    case 'weatherAlarm':
      let message = getWeather();
      if(message === '') return;
      noti.title = 'Weather Alarm';
      noti.message = message;
      break;
    default:
      return;
  }
  chrome.notifications.create(data.name, {
    type: 'basic',
    iconUrl: 'icon.png',
    title: noti.title,
    message: noti.message,
  }, (notificationId) => {
    chrome.notifications.clear(notificationId, () => {});
  });
}
