import React, { createContext, useContext } from 'react';

/**
 * Context for providing blocs to components
 */
const BlocContext = createContext({});

/**
 * BlocProvider component
 * 
 * This component provides blocs to the component tree.
 * 
 * @param {Object} props - Component props
 * @param {Object} props.blocs - Object containing blocs to provide
 * @param {React.ReactNode} props.children - Child components
 */
export const BlocProvider = ({ blocs, children }) => {
  return (
    <BlocContext.Provider value={blocs}>
      {children}
    </BlocContext.Provider>
  );
};

/**
 * Custom hook to use a bloc
 * 
 * @param {string} blocName - Name of the bloc to use
 * @returns {Object} The requested bloc
 */
export const useBloc = (blocName) => {
  const blocs = useContext(BlocContext);
  
  if (!blocs[blocName]) {
    throw new Error(`Bloc '${blocName}' not found in BlocProvider`);
  }
  
  return blocs[blocName];
};

export default BlocProvider;
