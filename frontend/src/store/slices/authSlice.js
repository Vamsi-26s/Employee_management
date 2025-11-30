import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/api.js';

const tokenKey = 'attendance_token';

const initialState = {
  user: null,
  token: localStorage.getItem(tokenKey) || null,
  status: 'idle',
  error: null,
};

export const login = createAsyncThunk('auth/login', async ({ email, password }, thunkAPI) => {
  try {
    const { data } = await api.post('/api/auth/login', { email, password });
    return data;
  } catch (err) {
    return thunkAPI.rejectWithValue(err.response?.data?.message || 'Login failed');
  }
});

export const register = createAsyncThunk('auth/register', async (payload, thunkAPI) => {
  try {
    const { data } = await api.post('/api/auth/register', payload);
    return data;
  } catch (err) {
    return thunkAPI.rejectWithValue(err.response?.data?.message || 'Register failed');
  }
});

export const fetchMe = createAsyncThunk('auth/me', async (_, thunkAPI) => {
  try {
    const { data } = await api.get('/api/auth/me');
    return data.user;
  } catch (err) {
    return thunkAPI.rejectWithValue('Failed to load user');
  }
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout(state) {
      state.user = null;
      state.token = null;
      localStorage.removeItem(tokenKey);
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => { state.status = 'loading'; state.error = null; })
      .addCase(login.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.token = action.payload.token;
        state.user = action.payload.user;
        localStorage.setItem(tokenKey, action.payload.token);
      })
      .addCase(login.rejected, (state, action) => { state.status = 'failed'; state.error = action.payload; })
      .addCase(register.pending, (state) => { state.status = 'loading'; state.error = null; })
      .addCase(register.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.token = action.payload.token;
        state.user = action.payload.user;
        localStorage.setItem(tokenKey, action.payload.token);
      })
      .addCase(register.rejected, (state, action) => { state.status = 'failed'; state.error = action.payload; })
      .addCase(fetchMe.fulfilled, (state, action) => { state.user = action.payload; })
    ;
  }
});

export const { logout } = authSlice.actions;
export default authSlice.reducer;