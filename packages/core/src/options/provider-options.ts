import Options, {getDefault as getDefaultOptions} from "./options";
import TezosConnector from "@ganache/tezos";
import EthereumConnector from "@ganache/ethereum";
import {entropyToMnemonic} from "bip39";
import seedrandom, {seedrandom_prng} from "seedrandom";
import Connector from "../interfaces/connector";

export const FlavorMap = {
  tezos: TezosConnector,
  ethereum: EthereumConnector
};

export type FlavorMap = {
  tezos: TezosConnector;
  ethereum: EthereumConnector;
};

export type Flavors = {
  [k in keyof FlavorMap]: FlavorMap[k];
}[keyof FlavorMap];

export type Apis<T extends Flavors = Flavors> = T extends Connector<infer R> ? R : never;

function randomBytes(length: number, rng: () => number) {
  const buf = Buffer.allocUnsafe(length);
  for (let i = 0; i < length; i++) {
    buf[i] = (rng() * 255) | 0;
  }
  return buf;
}

const randomAlphaNumericString = (() => {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const alphabetLength = alphabet.length;
  return (length: number, rng: () => number) => {
    let text = "";
    for (let i = 0; i < length; i++) {
      text += alphabet[(rng() * alphabetLength) | 0];
    }

    return text;
  };
})();

export default interface ProviderOptions extends Options {
  /**
   * Array of strings to installed subproviders
   */
  subProviders?: any[];

  flavor?: keyof typeof FlavorMap;
}

export const getDefault: (options?: ProviderOptions) => ProviderOptions = options => {
  const _options = Object.assign(
    {
      subProviders: [],
      flavor: "ethereum" as keyof typeof FlavorMap
    },
    getDefaultOptions(options)
  );

  if (!_options.mnemonic) {
    let rng: seedrandom_prng;
    let seed = _options.seed;
    if (!seed) {
      // do this so that we can use the same seed on our next run and get the same
      // results without explicitly setting a seed up front.
      // Use the alea PRNG for its extra speed.
      rng = seedrandom.alea as seedrandom_prng;
      seed = _options.seed = randomAlphaNumericString(10, rng());
    } else {
      // Use the default seedrandom PRNG for ganache-core < 3.0 back-compatibility
      rng = seedrandom;
    }
    // generate a randomized default mnemonic
    const _randomBytes = randomBytes(16, rng(seed));
    _options.mnemonic = entropyToMnemonic(_randomBytes);
  }
  return _options;
};
