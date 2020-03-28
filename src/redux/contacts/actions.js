import { getBoxManager } from '../box/selectors';
import { setRecipient } from '../payment/actions';

export const SET_MY_ACCOUNT = 'SET_MY_ACCOUNT';
export const SET_MY_ACCOUNT_LOADING = 'SET_MY_ACCOUNT_LOADING';

export const setMyAccount = (myAccount) => ({
  type: SET_MY_ACCOUNT,
  payload: {
    myAccount,
  }
});
export const setMyAccountLoading = (myAccountLoading = true) => ({
  type: SET_MY_ACCOUNT_LOADING,
  payload: {
    myAccountLoading,
  }
});

export const fetchMyAccount = () => async function (dispatch, getState)  {
  dispatch(setMyAccountLoading(true));

  const boxManager = getBoxManager(getState());
  const myAccount = await boxManager.getPrivate('myAccount');

  dispatch(setMyAccount(myAccount));
  dispatch(setRecipient(myAccount));
  dispatch(setMyAccountLoading(false));
};

export const updateMyAccount = (myAccount) => async function (dispatch, getState)  {
  const boxManager = getBoxManager(getState());

  await boxManager.setPrivate('myAccount', myAccount);
  console.log('saved account informations');

  dispatch(setMyAccount(myAccount));
};


export const resetContacts = () => function (dispatch)  {
  dispatch(setMyAccount(null));
  dispatch(setMyAccountLoading(false));
};
