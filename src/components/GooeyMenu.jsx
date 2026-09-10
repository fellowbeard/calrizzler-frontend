import { useEffect, useId, useRef, useState } from "react";
import { NavLink } from "react-router-dom";

import LogOut from "./LogOut.jsx";

export default function GooeyMenu({ currentUser, setCurrentUser, setCurrentAccount }) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);
  const titleId = useId();

  const isOwner = currentUser?.role === "owner";

  const menuItems = [
    {
      label: "Dashboard",
      icon: "D",
      to: "/userdashboard",
    },
    {
      label: "Appointments",
      icon: "A",
      to: "/appointments",
    },
    {
      label: "Clients",
      icon: "C",
      to: "/clients",
    },
    {
      label: "Services",
      icon: "S",
      to: "/services",
    },
    {
      label: "Resources",
      icon: "R",
      to: "/resources",
    },
  ];

  if (isOwner) {
    menuItems.push({
      label: "Account Settings",
      icon: "⚙",
      to: "/account/settings",
    });
  }

  const logoutIndex = menuItems.length;
  const menuCount = menuItems.length + 1;

  useEffect(() => {
    function handlePointerDown(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  function closeMenu() {
    setIsOpen(false);
  }

  return (
    <>
      <nav
        ref={menuRef}
        className={`gooey-menu ${isOpen ? "gooey-menu--open" : ""}`}
        aria-labelledby={titleId}
        style={{
          "--menu-count": menuCount,
        }}
      >
        <span id={titleId} className="visually-hidden">
          Main navigation
        </span>

        <svg className="gooey-menu__filter" aria-hidden="true" focusable="false">
          <defs>
            <filter id="calrizzler-goo" x="-50%" y="-20%" width="200%" height="140%" colorInterpolationFilters="sRGB">
              <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur" />

              <feColorMatrix
                in="blur"
                mode="matrix"
                values="
                  1 0 0 0 0
                  0 1 0 0 0
                  0 0 1 0 0
                  0 0 0 20 -9
                "
                result="goo"
              />

              <feBlend in="SourceGraphic" in2="goo" />
            </filter>
          </defs>
        </svg>

        <div className="gooey-menu__shapes" aria-hidden="true">
          {Array.from({ length: menuCount }).map((_, index) => (
            <span
              key={index}
              className="gooey-menu__shape"
              style={{
                "--index": index,
              }}
            />
          ))}
        </div>

        <button
          type="button"
          className="gooey-menu__toggle"
          aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={isOpen}
          aria-controls="calrizzler-menu-items"
          onClick={() => setIsOpen((current) => !current)}
        >
          <span className="gooey-menu__hamburger">
            <span />
            <span />
            <span />
          </span>
        </button>

        <div id="calrizzler-menu-items" className="gooey-menu__items" aria-hidden={!isOpen}>
          {menuItems.map((item, index) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `gooey-menu__item ${isActive ? "gooey-menu__item--active" : ""}`}
              style={{
                "--index": index,
              }}
              tabIndex={isOpen ? 0 : -1}
              onClick={closeMenu}
            >
              <span className="gooey-menu__icon" aria-hidden="true">
                {item.icon}
              </span>

              <span className="gooey-menu__label">{item.label}</span>
            </NavLink>
          ))}

          <div
            className="gooey-menu__item gooey-menu__logout"
            style={{
              "--index": logoutIndex,
            }}
            onClick={closeMenu}
          >
            <span className="gooey-menu__icon" aria-hidden="true">
              ↪
            </span>

            <div className="gooey-menu__logout-control" aria-hidden={!isOpen}>
              <LogOut setCurrentUser={setCurrentUser} setCurrentAccount={setCurrentAccount} />
            </div>
          </div>
        </div>
      </nav>

      {isOpen && (
        <button type="button" className="gooey-menu__backdrop" aria-label="Close navigation menu" onClick={closeMenu} />
      )}
    </>
  );
}
