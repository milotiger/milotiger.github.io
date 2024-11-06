/* global TrelloPowerUp */

const t = TrelloPowerUp.iframe(appInfo);

//console.log({ window, t });

const utils = {};

utils.setLocalStorage = ({ key, data }) => {
  window.localStorage.setItem(key, JSON.stringify(data));
}

utils.getLocalStorage = ({ key }) => {
  const rawData = window.localStorage.getItem(key) || "null";
  return JSON.parse(rawData);
};

const BOARD_CACHE_KEY = 'trello_sync_board_cache';

const renderBoardSelector = async ({ selectedBoardId, selectedListId, preLoadedBoards }) => {
  const token = await t.getRestApi().getToken();

  // preLoadedBoards = null;

  const boards = preLoadedBoards || await getAllUsersBoards({ token });

  // console.log({ boards });

  const boardOptionsHtml = boards
    .filter(board => board.idOrganization === '5b39c6bf614c48b0a45f1443') //todo: change to the marketing team id
    .map(board => {
      const { name, id } = board;
      return `<option value="${id}" ${id === selectedBoardId ? 'selected' : ''}>${name}</option>`;
    }).join("\n");

  const boardSelector = $('#board-selector');

  boardSelector.html(`<option selected disabled>Select a board...</option>` + boardOptionsHtml);

  if (selectedBoardId) {
    await renderListSelector({ boardId: selectedBoardId, selectedListId });
  }

  if (!preLoadedBoards) {
    const cachingBoard = boards
      .filter(board => board.idOrganization === '5b39c6bf614c48b0a45f1443' && !board.closed) //todo: change to the marketing team id
      .map(board => {
        return { id: board.id, name: board.name, idOrganization: board.idOrganization }
      });
    //todo: set board cache to the local storage
    // await t.set('member', 'shared', 'boardCache', { value: cachingBoard, expiredAt: Date.now() + 24 * 3600000 });
    utils.setLocalStorage({ key: BOARD_CACHE_KEY, data: { value: cachingBoard, expiredAt: Date.now() + 24 * 3600000 }});
  }

  boardSelector.removeAttr('disabled');

};

const renderListSelector = async ({ boardId, selectedListId }) => {
  const token = await t.getRestApi().getToken();

  return getAllBoardLists({ token, boardId })
    .then(lists => {
      const listOptionsHtml = lists
        .map(list => {
          const { name, id } = list;
          return `<option value="${id}" ${selectedListId === id ? 'selected' : ''}>${name}</option>`;
        }).join("\n");

      const listSelector = $('#list-selector');

      listSelector.html(`<option selected disabled>Select a list...</option>` + listOptionsHtml);

      listSelector.removeAttr('disabled');
    });
};

window['board-selector'].addEventListener('change', async (event) => {
  //console.log({ event });
  const selectedBoardId = event.target.value;
  //console.log({ selectedBoardId })
  const boardSelector = $('#board-selector');
  const listSelector = $('#list-selector');

  listSelector.attr('disabled', true);
  boardSelector.attr('disabled', true);
  await renderListSelector({ boardId: selectedBoardId });
  boardSelector.removeAttr('disabled');
});

window.syncSelector.addEventListener('submit', async (event) => {
  event.preventDefault();

  $('#button')
    .html('Loading...')
    .attr('disabled', true);

  const { board: currentBoardId, card: cardId } = await t.getContext();
  const { board: boardData, card: cardData, member } = await t.getAll();

  const token = member.private.trello_token;

  let signedToken = cardData.shared.jhSyncSignedToken;
  const currentWebhook = boardData.shared.jhSyncWebhook;

  if (!signedToken || !currentWebhook) {
    const { signedToken: currentSignedToken, webhookId, createdBy } = await exchangeToken({
      token,
      boardId: currentBoardId,
      shouldCreateWebhook: !currentWebhook,
    });
    signedToken = currentSignedToken;
    //console.log({ signedToken, webhookId, createdBy });
    await t.set('card', 'shared', 'jhSyncSignedToken', signedToken );
    if (webhookId) {
      await t.set('board', 'shared' , 'jhSyncWebhook', { webhookId, createdBy, createdAt: new Date().toISOString(), signedToken });
    }
  }

  const formData = new FormData(event.target);
  const syncCard = formData.get('syncCard') === 'true';
  const list = formData.get('list');
  const board = formData.get('board');

  // console.log({ syncCard, t, formData, list, board });
  const clonedCardId = cardData.shared.jhSyncClonedCardId;

  if (syncCard) {
    //todo: call api to check and trigger first sync
    const { clonedCardId: currentClonedCardId } = await checkSyncCard({
      signedToken,
      cardId,
      destinationListId: list,
      clonedCardId,
    });

    await t.set('card', 'shared', 'jhSyncClonedCardId', currentClonedCardId);
  }

  return t.set('card', 'shared', 'jhSync', { syncCard, list, board })
    .then(function(){
      t.alert({
        message: 'Sync configuration updated 🎉',
        duration: 6,
        display: 'success'
      });
      t.closePopup();
    });
});

const reloadBoardList = async () => {
  $('#board-selector').attr('disabled', true);
  $('#list-selector').attr('disabled', true);
  await masterRender({ ignoreCache: true });
};

const masterRender = async ({ ignoreCache } = {}) => {
  t.sizeTo('#syncSelector').done();

  const result = await t.get('card', 'shared', 'jhSync');

  //todo: get cache from local storage
  // const boardCache = await t.get('member', 'shared', 'boardCache');
  const boardCache = utils.getLocalStorage({ key: BOARD_CACHE_KEY });

  let { value: preLoadedBoards, expiredAt } = boardCache || {};

  if (!ignoreCache) {
    preLoadedBoards = Date.now() < expiredAt && preLoadedBoards;
  } else {
    preLoadedBoards = null;
  }

  const { syncCard, board, list } = result || {};

  //console.log({ syncCard, board, list, preLoadedBoards });

  renderBoardSelector({ selectedBoardId: board, selectedListId: list, preLoadedBoards: preLoadedBoards }).then();

  if (syncCard) {
    window['syncCard'].checked = true
  }
};

t.render(masterRender);
