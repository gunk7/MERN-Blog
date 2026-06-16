import { Link } from "react-router-dom";
import { Home, Compass } from "lucide-react"; 

const NotFound = () => {
  return (
    <main className="layout-new-age flex items-center justify-center">
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-primary-fixed-dim/20 rounded-full blur-3xl -z-10" />
      
      <div className="card-auth text-reveal flex flex-col items-center text-center">
        <div className="w-20 h-20 bg-surface-high rounded-full flex items-center justify-center mb-6 shadow-lavender">
          <Compass size={40} className="text-primary-container animate-pulse" />
        </div>

        <h1 className="text-6xl sm:text-7xl font-display text-primary mb-4">
          404
        </h1>
        
        <h2 className="text-2xl sm:text-3xl font-bold text-on-surface mb-4">
          Lost in the Archives?
        </h2>
        
        <p className="text-on-surface-variant text-base sm:text-lg italic mb-10 max-w-xs mx-auto">
          The page you are looking for has been moved, deleted, or never existed in our collection.
        </p>

        <div className="w-full">
          <Link to="/">
            <button className="btn-editorial group">
              <Home size={20} className="transition-transform group-hover:-translate-y-1" />
              <span>Return to Sanctuary</span>
            </button>
          </Link>
        </div>

        {/* Subtle Footer */}
        <p className="mt-8 text-xs text-on-surface-variant/40 uppercase tracking-widest font-bold">
          Error Code: Page_Missing_04
        </p>
      </div>
      
      {/* Bottom Decorative Element */}
      <div className="absolute bottom-[-5%] right-[-5%] w-64 h-64 bg-primary/10 rounded-full blur-2xl -z-10" />
    </main>
  );
};

export default NotFound;