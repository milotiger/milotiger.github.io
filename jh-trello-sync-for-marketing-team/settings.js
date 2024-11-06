/* global TrelloPowerUp */

const t = TrelloPowerUp.iframe(appInfo);

window.settings.addEventListener('submit', async (event) => {
  event.preventDefault();

  const formData = new FormData(event.target);

  const autoSort = formData.get('autoSort');
  const priority = formData.get('priority');
  const price = formData.get('price');
  const size = formData.get('size');
  const delay  = formData.get('delay');
  const number  = formData.get('number');

  const displaySettings = {
    autoSort: autoSort === 'true',
    priority: priority === 'true',
    price: price === 'true',
    size: size === 'true',
    delay: delay === 'true',
    number: number === 'true',
  };

  // console.log(displaySettings, 'displaySettings');

  return t.set('board', 'shared', 'displaySettings', displaySettings)
    .then(function(){
      t.alert({
        message: 'Settings updated 🎉',
        duration: 6,
        display: 'success'
      });
      t.closePopup();
    });
});


t.render(function(){
  return t.get('board', 'shared', 'displaySettings')
    .then(function(displaySettings){

      const {
        autoSort,
        priority,
        price,
        size,
        delay,
        number
      } = displaySettings;

      window.autoSort.checked = autoSort;
      window.priority.checked = priority;
      window.price.checked = price;
      window.size.checked = size;
      window.delay.checked = delay;
      window.number.checked = number;

    })
    .then(function(){
      // console.log('size');
      setTimeout(() => {
        t.sizeTo('#settings').done();
      });
    });
});
