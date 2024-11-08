
const getAuthorizePopup = function(t) {
  return t.getRestApi()
    .isAuthorized()
    .then(function (isAuthorized) {

      // // console.log({ isAuthorized });

      if (isAuthorized) {
        return t.popup({
          title: "JH Sync",
          url: './sync_selector.html'
        });
      }

      return t.popup({
        title: 'Authorize to continue',
        url: './authorize.html'
      });
    })
};

let cardNumberInProgress = false;
let updateCardPriorityInProgress = false;

const delay = (milisec) => {
  return new Promise((resolve) => {
    setTimeout(resolve, milisec);
  });
};


window.TrelloPowerUp.initialize({
  'card-buttons': async function(t, options){
    return [{
      icon: 'https://cdn.glitch.com/a9f0c7de-a40c-46c9-ae68-db223b4019be%2Fslack_emoji_trello.png?v=1570442125991',
      text: 'JH MKT Sync',
      callback: await getAuthorizePopup,
    }];
  },
  'card-detail-badges': async function(t, options) {
    const { jhSync } = await t.get('card', 'shared');

    const { syncCard } = jhSync || {};
   
    return [
      {
        title: 'In Synced',
        text: syncCard ? 'YES' : 'NO',
        color: 'green',
        icon: iconUrl,
        callback: await getAuthorizePopup
      }
    ];
  },
  'board-buttons': async function (t, opts) {
    return [{
      icon: iconUrl,
      text: 'Sync Settings',
      url: './onboarding.html',
      // condition: 'edit'
    }];
  },
  'show-settings': function(t, options){
    // when a user clicks the gear icon by your Power-Up in the Power-Ups menu
    // what should Trello show. We highly recommend the popup in this case as
    // it is the least disruptive, and fits in well with the rest of Trello's UX
    return t.popup({
      title: 'JH Estimate Settings',
      url: './settings.html'
    });
  },
  'on-enable': async function (t, options) {
    return t.modal({
      url: './onboarding.html',
      height: 500,
      title: 'Journey Horizon Estimates Overview'
    });
  },
  'authorization-status': async function (t, options) {
    const isAuthorized = await t.getRestApi().isAuthorized();
    // console.log({ isAuthorized }, 'authorization-status');
    if (!isAuthorized) {
      return t.modal({
        title: 'Authorize to continue',
        url: './authorize.html'
      });
    } else {
      t.alert({
        message: 'You are currently logged in 🎉',
        duration: 6,
        display: 'info'
      });
    }
  },
  'show-authorization': async function (t, options) {
    const isAuthorized = await t.getRestApi().isAuthorized();
    // console.log({ isAuthorized }, 'show-authorization');
    if (isAuthorized) {
      return t.modal({
        title: "Authorize Status",
        url: './authorize_status.html'
      });
    } else {
      return t.modal({
        title: 'Authorize to continue',
        url: './authorize.html'
      });
    }
  },
}, appInfo);
