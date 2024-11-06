/* global TrelloPowerUp */

const t = TrelloPowerUp.iframe(appInfo);

window.estimate.addEventListener('submit', async (event) => {
  event.preventDefault();
  const token = await t.getRestApi().getToken();

  //console.log({ token });

  let cardDetail = await t.card('id', 'desc', 'labels');
  const { id: boardId, labels: currentLabels} = await t.board('id', 'labels');


  const formData = new FormData(event.target);
  // const difficulty = formData.get('difficulty');
  const price = formData.get('price');
  const cardSize = formData.get('cardSize');
  const delayCost = formData.get('delayCost');

  const priority = cardSize && delayCost && parseFloat(delayCost) / parseFloat(cardSize);

  cardDetail.desc = cardDetail.desc.replace(/(\*\*PRICE.*\*\*)/gi, '');
  cardDetail.desc = cardDetail.desc.replace(/(\*\*PRIORITY.*\*\*)/gi, '');

  if (price) {
    cardDetail.desc = `**PRICE = $${price}**\n` + cardDetail.desc;
    cardDetail.desc = cardDetail.desc.split('\n\n\n').join('\n\n');
    if (!cardDetail.labels.find((label) => label.name === 'Estimated')) {
      addEstimatedLabelToCard({ cardId: cardDetail.id, token })
        .then(() => {
          // console.log('Label added')
        });
    } else {
      // console.log('Label existed!');
    }

  } else {
    removeEstimatedFromCard({ cardId: cardDetail.id, boardId, currentLabels, token })
      .then(() => {
        // console.log('Label removed');
      })
  }

  if (priority) {
    cardDetail.desc = `**PRIORITY: ${priority.toFixed(2)}**\n` + cardDetail.desc;
  }

  cardDetail.desc = cardDetail.desc.split('\n\n\n').join('\n\n');
  cardDetail.desc = cardDetail.desc.split('\n\n\n').join('\n\n');
  cardDetail.desc = cardDetail.desc.split('\n\n\n').join('\n\n');

  await updateCard({
    id: cardDetail.id,
    data: { desc: cardDetail.desc },
    token,
  });

  // const cards = await t.cards('id', 'name', 'idList');
  // const sharedData = await t.getAll();
  //
  // // console.log(JSON.stringify(cards));
  // // console.log(JSON.stringify(sharedData));

  // // console.log({ price, difficulty });

  return t.set('card', 'shared', 'estimate', { price, cardSize, delayCost, priority })
    .then(function(){
      t.alert({
        message: 'Estimation updated 🎉',
        duration: 6,
        display: 'success'
      });
      t.closePopup();
    });
});

t.render(function(){
  return t.get('card', 'shared', 'estimate')
    .then(function(estimate){
      const { price, cardSize, delayCost } = estimate || {};

      // console.log({ price, cardSize, delayCost });

      if (cardSize) {
        window[`cardSize${cardSize}`].checked = true
      }

      if (delayCost) {
        window[`delayCost${delayCost}`].checked = true
      }

      window.price.value = parseFloat(price);
    })
    .then(function(){
      t.sizeTo('#estimate').done();
    });
});
