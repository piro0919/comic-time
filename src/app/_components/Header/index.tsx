import { Menu, MenuButton, MenuDivider, MenuItem } from "@szhsin/react-menu";
import clsx from "clsx";
import { useTheme } from "next-themes";
import { Grape_Nuts } from "next/font/google";
import { useQueryState } from "nuqs";
import { BsFileEarmarkSpreadsheetFill } from "react-icons/bs";
import { CgMenuGridO } from "react-icons/cg";
import { FaMoon, FaSun } from "react-icons/fa";
import { GrDownload } from "react-icons/gr";
import { RiExternalLinkFill, RiFileAddFill } from "react-icons/ri";
import Spacer from "react-spacer";
import usePwa from "use-pwa";
import styles from "./style.module.css";

const grapeNuts = Grape_Nuts({
  subsets: ["latin"],
  weight: "400",
});

export default function Header(): React.JSX.Element {
  const { setTheme, theme } = useTheme();
  const {
    appinstalled,
    canInstallprompt,
    enabledPwa,
    isPwa,
    showInstallPrompt,
  } = usePwa();
  const [, setDay] = useQueryState("day");

  return (
    <header className={styles.header}>
      <h1
        onClick={() => {
          setDay(null);
        }}
        className={clsx(grapeNuts.className, styles.h1)}
      >
        ComicTime
      </h1>
      <Spacer grow={1} />
      <Menu
        menuButton={
          <MenuButton>
            <CgMenuGridO size={24} />
          </MenuButton>
        }
        align="end"
        arrow={true}
        direction="bottom"
        theming={theme}
      >
        {theme === "dark" ? (
          <MenuItem
            className={styles.menuItem}
            onClick={() => setTheme("light")}
          >
            <FaMoon size={15} />
            <div className={styles.name}>ダークモード</div>
          </MenuItem>
        ) : (
          <MenuItem
            className={styles.menuItem}
            onClick={() => setTheme("dark")}
          >
            <FaSun size={15} />
            <div className={styles.name}>ライトモード</div>
          </MenuItem>
        )}
        <MenuDivider />
        <MenuItem
          className={styles.menuItem}
          href="https://docs.google.com/spreadsheets/d/1QN6pSfAyyQxE1GJXf_TxsCc5uL-J1hceXFWUPq10rAE/edit?usp=sharing"
          rel="noopener noreferrer"
          target="_blank"
        >
          <BsFileEarmarkSpreadsheetFill size={15} />
          <div className={styles.name}>
            サイト一覧
            <RiExternalLinkFill size={15} />
          </div>
        </MenuItem>
        <MenuItem
          className={styles.menuItem}
          href="https://forms.gle/PiDsgiAiqi8exA5MA"
          rel="noopener noreferrer"
          target="_blank"
        >
          <RiFileAddFill size={15} />
          <div className={styles.name}>
            サイトの追加
            <RiExternalLinkFill size={15} />
          </div>
        </MenuItem>
        {enabledPwa && !isPwa ? (
          <>
            <MenuDivider />
            <MenuItem
              className={styles.menuItem}
              disabled={!canInstallprompt || appinstalled}
              onClick={showInstallPrompt}
            >
              <GrDownload size={15} />
              <div className={styles.name}>インストール</div>
            </MenuItem>
          </>
        ) : null}
      </Menu>
    </header>
  );
}
