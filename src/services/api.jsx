// src/services/api.js
import axios from 'axios';
const API_BASE = import.meta.env.VITE_API_BASE_URL;

const api = axios.create({
    baseURL: API_BASE,
    headers: {
        'Content-Type': 'application/json',
    },
});

/* =================================================================
   INTERCEPTOR (The "Auth" Magic)
   ================================================================= */
// This runs before EVERY request. It grabs the token and attaches it.
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

/* =================================================================
   AUTHENTICATION (Login & Register)
   ================================================================= */
export const registerUser = (userData) =>
    api.post('/auth/register', userData);

export const loginUser = (loginData) =>
    api.post('/auth/login', loginData);

/* =================================================================
   TREASURY (Budgets, Goals, Subscriptions, Transactions)
   ================================================================= */

/* --- Budgets --- */
export const fetchBudgets = () =>
    api.get('/budget');

export const fetchBudgetById = (id) =>
    api.get(`/budget/${id}`);

export const createBudget = (data) =>
    api.post('/budget', data);

export const updateBudget = (id, data) =>
    api.put(`/budget/${id}`, data);

export const deleteBudget = (id) =>
    api.delete(`/budget/${id}`);

export const fetchBudgetSummary = () =>
    api.get('/budget/summary');


/* --- Goals --- */
export const fetchGoals = () =>
    api.get('/goal');

export const fetchGoalById = (id) =>
    api.get(`/goal/${id}`);

export const createGoal = (data) =>
    api.post('/goal', data);

export const updateGoal = (id, data) =>
    api.put(`/goal/${id}`, data);

export const deleteGoal = (id) =>
    api.delete(`/goal/${id}`);

export const deleteAllGoals = () =>
    api.delete('/goal/delete-all');

export const fetchGoalStats = () =>
    api.get('/goal/stats');


/* --- Subscriptions --- */
export const fetchSubscriptions = (active = null) => {
    const params = active !== null ? { active } : {};
    return api.get('/subscriptions', { params });
};

export const fetchSubscriptionById = (id) =>
    api.get(`/subscriptions/${id}`);

export const createSubscription = (data) =>
    api.post('/subscriptions', data);

export const toggleSubscription = (id) =>
    api.put(`/subscriptions/${id}/toggle`);

export const deleteSubscription = (id) =>
    api.delete(`/subscriptions/${id}`);


/* --- Transactions --- */
export const fetchTransactions = (keyword = '') =>
    api.get(`/transactions${keyword ? `?keyword=${keyword}` : ''}`);

export const fetchTransactionById = (id) =>
    api.get(`/transactions/${id}`);

export const createTransaction = (data) =>
    api.post('/transactions', data);

export const updateTransaction = (id, data) =>
    api.put(`/transactions/${id}`, data);

export const deleteTransaction = (id) =>
    api.delete(`/transactions/${id}`);

export const fetchTransactionNetAmount = () =>
    api.get('/transactions/summary/net');


/* =================================================================
   WEALTH (Assets, Debt, Net Worth)
   ================================================================= */

/* --- Assets --- */
export const fetchAssets = () =>
    api.get('/assets');

export const fetchAssetById = (id) =>
    api.get(`/assets/${id}`);

export const createAsset = (data) =>
    api.post('/assets', data);

export const updateAsset = (id, data) =>
    api.put(`/assets/${id}`, data);

export const deleteAsset = (id) =>
    api.delete(`/assets/${id}`);

export const allAssetsAmount = () =>
    api.get('/assets/total-value');


/* --- Debt --- */
export const fetchDebts = () =>
    api.get('/debts');

export const fetchDebtById = (id) =>
    api.get(`/debts/${id}`);

export const createDebt = (data) =>
    api.post('/debts', data);

export const updateDebt = (id, data) =>
    api.put(`/debts/${id}`, data);

export const deleteDebt = (id) =>
    api.delete(`/debts/${id}`);

export const fetchDebtStats = () =>
    api.get('/debts/stats');


/* --- Net Worth --- */
export const fetchNetWorth = () =>
    api.get('/networth');


/* =================================================================
   PROTECTION (Insurance, Contingency)
   ================================================================= */

/* --- Insurance --- */
export const fetchPolicies = () =>
    api.get('/insurance');

export const fetchPolicyById = (id) =>
    api.get(`/insurance/${id}`);

export const createPolicy = (data) =>
    api.post('/insurance', data);

export const updatePolicy = (id, data) =>
    api.put(`/insurance/${id}`, data);

export const deletePolicy = (id) =>
    api.delete(`/insurance/${id}`);

export const fetchActivePolicies = () =>
    api.get('/insurance/status/active');

export const fetchExpiringPolicies = () =>
    api.get('/insurance/status/expiring');

export const fetchPoliciesByCategory = (category) =>
    api.get(`/insurance/category/${category}`);


/* --- Contingency --- */
export const fetchFinancialHealth = () =>
    api.get('/protection/contingency/health');


/* =================================================================
   Chat / AI
   ================================================================= */
export const sendChat = (query) =>
    api.post('/chat', { query });


export default api;