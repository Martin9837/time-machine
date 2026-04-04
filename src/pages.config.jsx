import { lazy, Suspense } from 'react';
import __Layout from './Layout.jsx';

const Discover    = lazy(() => import('./pages/Discover'));
const Home        = lazy(() => import('./pages/Home'));
const Matches     = lazy(() => import('./pages/Matches'));
const Messages    = lazy(() => import('./pages/Messages'));
const Profile     = lazy(() => import('./pages/Profile'));
const TimeMachine = lazy(() => import('./pages/TimeMachine'));

const wrap = (Component) => (props) => (
  <Suspense fallback={
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100%', minHeight:300 }}>
      <div style={{ width:32, height:32, border:'3px solid #ede9fe', borderTopColor:'#7c3aed', borderRadius:'50%', animation:'spin .6s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  }>
    <Component {...props} />
  </Suspense>
);

export const PAGES = {
  "Discover":    wrap(Discover),
  "Home":        wrap(Home),
  "Matches":     wrap(Matches),
  "Messages":    wrap(Messages),
  "Profile":     wrap(Profile),
  "TimeMachine": wrap(TimeMachine),
};

export const pagesConfig = {
  mainPage: "Home",
  Pages: PAGES,
  Layout: __Layout,
};
