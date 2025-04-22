// Packages
import { WalletType } from "graz";

// Icons
import {
  KeplrIcon,
  LeapIcon,
  WalletConnect,
  MetamaskIcon,
} from "@/components/icons/index";
import { JSX } from "react";

// Types
export type SupportedWallet = {
  name: string;
  icon: JSX.Element;
  walletType: WalletType;
  url: string;
  isMobile?: boolean;
};

export const supportedWallets: SupportedWallet[] = [
  {
    name: "Keplr",
    icon: <KeplrIcon />,
    walletType: WalletType.KEPLR,
    url: "https://chromewebstore.google.com/detail/keplr/dmkamcknogkgcdfhhbddcghachkejeap",
  },
  {
    name: "Leap",
    icon: <LeapIcon />,
    walletType: WalletType.LEAP,
    url: "https://chromewebstore.google.com/detail/leap-cosmos-wallet/fcfcfllfndlomdhbehjjcoimbgofdncg",
  },
  {
    name: "WalletConnect",
    icon: <WalletConnect />,
    walletType: WalletType.WALLETCONNECT,
    url: "https://apps.apple.com/us/app/coinbase-wallet-nfts-crypto/id1278383455",
    isMobile: true,
  },
  {
    name: "Metamask Snaps",
    icon: <MetamaskIcon />,
    walletType: WalletType.METAMASK_SNAP_LEAP,
    url: "https://chromewebstore.google.com/detail/metamask/nkbihfbeogaeaoehlefnkodbefgpgknn?hl=en",
    isMobile: true,
  },
  {
    name: "Keplr Mobile",
    icon: <KeplrIcon />,
    walletType: WalletType.WC_KEPLR_MOBILE,
    url: "https://apps.apple.com/us/app/keplr-wallet/id1567851089",
    isMobile: true,
  },
  {
    name: "Leap Mobile",
    icon: <LeapIcon />,
    walletType: WalletType.WC_LEAP_MOBILE,
    url: "https://apps.apple.com/us/app/leap-cosmos/id1642465549",
    isMobile: true,
  },
];
