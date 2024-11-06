const iconUrl = 'https://cdn.glitch.com/a9f0c7de-a40c-46c9-ae68-db223b4019be%2FJH-JourneyH-white-L%20copy_white.png?v=1570441982846';
const cardSizeIcon = 'https://cdn.glitch.com/a9f0c7de-a40c-46c9-ae68-db223b4019be%2Fweight-tool.png?v=1570616621621';
const delayCostIcon = 'https://cdn.glitch.com/a9f0c7de-a40c-46c9-ae68-db223b4019be%2Fclock-circular-outline.png?v=1570616812987';
const priorityIcon = 'https://cdn.glitch.com/a9f0c7de-a40c-46c9-ae68-db223b4019be%2Fweight-balance.png?v=1570617124443';

const getPriorityColor = (priority) => {
  if (priority < 2) {
    return 'green'
  } else if (priority < 5) {
    return 'orange'
  } else {
    return 'red'
  }
};

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

const setCardNumber = async (t, cardNumber) => {

  while (cardNumberInProgress) {
    await delay(50);
  }

  cardNumberInProgress = true;

  const cardNumberIndex = await t.get('board', 'shared', 'cardNumberIndex') || 0;
  // console.log({ cardNumberIndex });
  // console.log({ cardNumber });
  if (!cardNumber) {
    await t.set('card', 'shared', 'cardNumber', cardNumberIndex + 1);
    await t.set('board', 'shared', 'cardNumberIndex', cardNumberIndex + 1);
  }

  cardNumberInProgress = false;
};

const setPriorityToBoard = async (t, priority) => {

  while (updateCardPriorityInProgress) {
    await delay(50);
  }

  updateCardPriorityInProgress = true;

  const { id: cardId, idList: listId } = await t.card('id', 'idList');
  const cardPriorities = await t.get('board', 'shared', 'cardPriorities') || {};
  cardPriorities[listId] = cardPriorities[listId] || {};

  if (cardPriorities[listId][cardId] === priority) {
    updateCardPriorityInProgress = false;
    return;
  }

  cardPriorities[listId][cardId] = priority;

  await t.set('board', 'shared', 'cardPriorities', cardPriorities);

  // console.log(JSON.stringify({ cardId, priority, cardPriorities }));

  const autoSort = await t.get('board', 'shared', 'autoSort') || 0;

  // console.log(autoSort, 'autoSort');

  autoSort && await orderByPriority(t);

  updateCardPriorityInProgress = false;
};

const orderByPriority = async (t) => {
  const token = await t.getRestApi().getToken();

  const cardPriorities = await t.get('board', 'shared', 'cardPriorities') || {};
  // console.log(JSON.stringify(cardPriorities));
  Object.keys(cardPriorities).forEach((listId) => {
    const cardsObj = cardPriorities[listId];

    const cardArray = Object.keys(cardsObj)
      .map(cardId => {
        return {
          id: cardId,
          priority: cardsObj[cardId]
        }
      })
      .sort((card1, card2) => {
        return card1.priority < card2.priority ? 1 : -1;
      });

    cardArray.forEach(async (card, index) => {
      // console.log(card, 'card');
      // console.log(index, 'index');
      return await updateCard({
        id: card.id,
        data: {
          pos: index + 1,
        },
        token
      })
    });

    // console.log(JSON.stringify(cardArray));
  });
}

window.TrelloPowerUp.initialize({
  'card-buttons': async function(t, options){
    return [{
      icon: 'https://cdn.glitch.com/a9f0c7de-a40c-46c9-ae68-db223b4019be%2Fslack_emoji_trello.png?v=1570442125991',
      text: 'JH Sync',
      callback: await getAuthorizePopup,
    }];
  },
  'card-badges': async function(t, options) {
    const { estimate, cardNumber } = await t.get('card', 'shared');
    const { displaySettings = {} } = await t.get('board', 'shared');

    const { price, priority, cardSize, delayCost } = estimate || {};

    if (!cardNumber) {
      await setCardNumber(t, cardNumber);
    }

    if (priority) {
      await setPriorityToBoard(t, priority);
    }

    return [
      displaySettings.number && cardNumber && {
        text: `#${cardNumber}`,
      },
      displaySettings.priority && priority && {
        title: 'Priority',
        text: priority.toFixed(2),
        color: getPriorityColor(priority),
        icon: priorityIcon,
      },
      displaySettings.price && price && {
        text: `$${price}`,
        color: "green",
      },
      displaySettings.size && cardSize && {
        title: 'Priority',
        text: cardSize,
        icon: cardSizeIcon,
      },
      displaySettings.delay && delayCost && {
        title: 'Priority',
        text: delayCost,
        icon: delayCostIcon,
      },
    ];
  },
  'card-detail-badges': async function(t, options) {
    const { estimate, cardNumber, jhSync } = await t.get('card', 'shared');
    const { displaySettings = {} } = await t.get('board', 'shared');
    const { price, priority, cardSize, delayCost } = estimate || {};
    const { syncCard } = jhSync || {};
    // const { shortUrl } = await t.card('shortUrl');

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
