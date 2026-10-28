const APPS = [{
    id: 'corporate',
    n: 'Corporate',
    c: '#214A3C',
    g: '<rect x="4" y="4" width="7" height="7" rx="1.5" fill="#fff"/><rect x="13" y="4" width="7" height="7" rx="1.5" fill="#A9CD69"/><rect x="4" y="13" width="7" height="7" rx="1.5" fill="#A9CD69"/><rect x="13" y="13" width="7" height="7" rx="1.5" fill="#fff"/>'
  }, {
    id: 'fa',
    n: 'Finance & Accounts',
    c: '#4B6B78',
    g: '<path d="M4 5c3-1 5-1 8 1v14c-3-2-5-2-8-1z" fill="#fff" opacity=".7"/><path d="M20 5c-3-1-5-1-8 1v14c3-2 5-2 8-1z" fill="#fff"/>'
  }, {
    id: 'treasury',
    n: 'Treasury',
    c: '#6E7F3A',
    g: '<path d="M12 3l9 5H3z" fill="#fff"/><rect x="5" y="10" width="2.5" height="7" fill="#fff" opacity=".7"/><rect x="10.75" y="10" width="2.5" height="7" fill="#fff" opacity=".7"/><rect x="16.5" y="10" width="2.5" height="7" fill="#fff" opacity=".7"/><rect x="3" y="18" width="18" height="2.5" rx=".5" fill="#fff"/>'
  }, {
    id: 'strategy',
    n: 'Strategy',
    c: '#3E6A3F',
    g: '<circle cx="12" cy="12" r="8.5" fill="#fff" opacity=".45"/><circle cx="12" cy="12" r="5.5" fill="#fff" opacity=".75"/><circle cx="12" cy="12" r="2.5" fill="#fff"/>'
  }, {
    id: 'investment',
    n: 'Investment & Deals',
    c: '#7FA84A',
    g: '<path d="M5 19L17 7" stroke="#fff" stroke-width="3" stroke-linecap="round"/><path d="M9 6h10v10" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>'
  }, {
    id: 'pmo',
    n: 'PMO',
    c: '#8A6B4E',
    g: '<rect x="4" y="5" width="9" height="3.5" rx="1.5" fill="#fff"/><rect x="8" y="10.25" width="10" height="3.5" rx="1.5" fill="#fff" opacity=".75"/><rect x="12" y="15.5" width="8" height="3.5" rx="1.5" fill="#fff" opacity=".55"/>'
  }, {
    id: 'am',
    n: 'Asset Management',
    c: '#2D5A6B',
    g: '<path d="M12 3l9 4.5-9 4.5-9-4.5z" fill="#fff"/><path d="M3 12l9 4.5 9-4.5" fill="none" stroke="#fff" stroke-width="2" opacity=".75"/><path d="M3 16.5l9 4.5 9-4.5" fill="none" stroke="#fff" stroke-width="2" opacity=".5"/>'
  }, {
    id: 'admin',
    n: 'Admin / Settings',
    c: '#56645C',
    g: '<circle cx="12" cy="12" r="3.2" fill="none" stroke="#fff" stroke-width="2.2"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1" stroke="#fff" stroke-width="2.2" stroke-linecap="round"/>'
  }];

const routes={corporate:'/corporate',fa:'/finance',treasury:'/treasury',strategy:'/strategy',investment:'/',pmo:'/pmo',am:'/asset-management',admin:'/settings'};
export const applets=APPS.map(a=>({...a,href:routes[a.id]}));
