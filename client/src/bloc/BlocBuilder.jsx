import React, { useState, useEffect } from 'react';

/**
 * BlocBuilder component
 * 
 * This component builds UI based on bloc states.
 * 
 * @param {Object} props - Component props
 * @param {Object} props.bloc - The bloc to listen to
 * @param {Function} props.builder - Function that builds UI based on state
 */
const BlocBuilder = ({ bloc, builder }) => {
  const [state, setState] = useState(bloc.state);

  useEffect(() => {
    // Subscribe to bloc state changes
    const unsubscribe = bloc.addListener((newState) => {
      setState(newState);
    });

    // Unsubscribe when component unmounts
    return () => {
      unsubscribe();
    };
  }, [bloc]);

  // Build UI based on current state
  return builder(state);
};

export default BlocBuilder;
