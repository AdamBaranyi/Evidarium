'use client';

import { createContext, useContext } from 'react';
import { STANDARD_SPRACHE, type Sprache } from './sprachen';
import type { Katalog, Form } from './texte';

/*
 * Die Sprache im Browser. Der Server ermittelt sie je Anfrage und gibt sie
 * über das Wurzellayout herein — der Browser rät nie selbst, sonst stünde
 * nach dem Laden kurz eine andere Sprache da als vom Server gerendert.
 */

const SprachKontext = createContext<Sprache>(STANDARD_SPRACHE);

export function SprachAnbieter({
  sprache,
  children,
}: {
  sprache: Sprache;
  children: React.ReactNode;
}) {
  return <SprachKontext value={sprache}>{children}</SprachKontext>;
}

export function useSprache(): Sprache {
  return useContext(SprachKontext);
}

export function useTexte<T>(katalog: Katalog<T>): Form<T> {
  return katalog[useSprache()];
}
