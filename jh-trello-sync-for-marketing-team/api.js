
// const serverUrl = window.TrelloPowerUp.util.relativeUrl().split('/public')[0];
const getServerUrl = () => {
  return serverUrl;
};

const makeTrelloRequest = async ({ url, method = 'GET', data, token }) => {
  const result = await fetch(`${url}?key=${appInfo.appKey}&token=${token}`,
    {
    method,
    headers: {
      'Content-type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(data),
  });

  return await result.json();
};

const makeServerRequest = async ({ url, method = 'GET', data }) => {
  const result = await fetch(`${getServerUrl()}${url}`,
    {
      method,
      headers: {
        'Content-type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(data),
    });

  return await result.json();
};

const updateCard = ({ id, data, token }) => {
  return window.Trello.put(`/cards/${id}?token=${token}&key=${appInfo.appKey}`, data);
};

const addEstimatedLabelToCard = async ({ cardId, token }) => {
  return window.Trello.post(`/cards/${cardId}/labels?color=green&name=Estimated&key=${appInfo.appKey}&token=${token}`);
};

const removeEstimatedFromCard = async ({ cardId, currentLabels, boardId, token }) => {
  let estimatedLabel = currentLabels.find((label) => label.name === 'Estimated');

  if (!estimatedLabel) {
    estimatedLabel = await window.Trello.post(`/labels?name=Estimated&color=green&idBoard=${boardId}&key=${appInfo.appKey}&token=${token}`)
  }

  const labelId = estimatedLabel.id;

  return window.Trello.delete(`/cards/${cardId}/idLabels/${labelId}?key=${appInfo.appKey}&token=${token}`);
};

const getTokenMember = ({ token }) => {
  return makeTrelloRequest({
    url: `https://api.trello.com/1/tokens/${token}/member`,
    token,
  })
};

const getAllUsersBoards = async ({ token }) => {
  const member = await getTokenMember({ token });
  return makeTrelloRequest({
    url: `https://api.trello.com/1/members/${member.id}/boards`,
    token,
  })
};

const getAllBoardLists = async ({ token, boardId }) => {
  return makeTrelloRequest({
    url: `https://api.trello.com/1/boards/${boardId}/lists`,
    token,
  })
};

const exchangeToken = async ({ token, boardId, shouldCreateWebhook }) => {
  return makeServerRequest({
    url: '/trello-jh-sync/exchange-token',
    method: 'POST',
    data: {
      token,
      boardId,
      shouldCreateWebhook,
      host: getServerUrl(),
    }
  })
};

const checkSyncCard = async ({ signedToken, cardId, destinationListId, clonedCardId }) => {
  return makeServerRequest({
    url: '/trello-jh-sync/check-sync',
    method: 'POST',
    data: {
      signedToken,
      cardId,
      destinationListId,
      clonedCardId,
    }
  })
};
