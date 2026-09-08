import { useEffect, useId, useRef, useState } from "react";
import { NavLink } from "react-router-dom";

import LogOut from "./LogOut.jsx";

export default function GooeyMenu({
  currentUser,
  setCurrentUser,
  setCurrentAccount,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);
  const titleId = useId();

  const isOwner = currentUser?.role === "owner";

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
      >
        <span id={titleId} className="visually-hidden">
          Main navigation
        </span>
        <svg
          className="gooey-menu__filter"
          aria-hidden="true"
          focusable="false"
        >
          <defs>
            <filter
              id="calrizzler-goo"
              x="-50%"
              y="-20%"
              width="200%"
              height="140%"
              colorInterpolationFilters="sRGB"
            >
              <feGaussianBlur
                in="SourceGraphic"
                stdDeviation="6"
                result="blur"
              />

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

              <feBlend
                in="SourceGraphic"
                in2="goo"
              />
            </filter>
          </defs>
        </svg>

        <div className="gooey-menu__shapes" aria-hidden="true">
          <span className="gooey-menu__shape gooey-menu__shape--1" />

          {isOwner && (
            <span className="gooey-menu__shape gooey-menu__shape--2" />
          )}

          <span
            className={`gooey-menu__shape ${
              isOwner
                ? "gooey-menu__shape--3"
                : "gooey-menu__shape--2"
            }`}
          />
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

        <div
          id="calrizzler-menu-items"
          className="gooey-menu__items"
          aria-hidden={!isOpen}
        >
          <NavLink
            to="/userdashboard"
            className={({ isActive }) =>
              `gooey-menu__item ${
                isActive ? "gooey-menu__item--active" : ""
              }`
            }
            tabIndex={isOpen ? 0 : -1}
            onClick={closeMenu}
          >
            <span className="gooey-menu__icon" aria-hidden="true">
              D
            </span>

            <span className="gooey-menu__label">Dashboard</span>
          </NavLink>

          {isOwner && (
            <NavLink
              to="/account/settings"
              className={({ isActive }) =>
                `gooey-menu__item ${
                  isActive ? "gooey-menu__item--active" : ""
                }`
              }
              tabIndex={isOpen ? 0 : -1}
              onClick={closeMenu}
            >
              <span className="gooey-menu__icon" aria-hidden="true">
                S
              </span>

              <span className="gooey-menu__label">
                Account Settings
              </span>
            </NavLink>
          )}

          <div
            className="gooey-menu__item gooey-menu__logout"
            onClick={closeMenu}
          >
            <span className="gooey-menu__icon" aria-hidden="true">
              ↪
            </span>

            <div
              className="gooey-menu__logout-control"
              aria-hidden={!isOpen}
            >
              <LogOut
                setCurrentUser={setCurrentUser}
                setCurrentAccount={setCurrentAccount}
              />
            </div>
          </div>
        </div>
      </nav>

      {isOpen && (
        <button
          type="button"
          className="gooey-menu__backdrop"
          aria-label="Close navigation menu"
          onClick={closeMenu}
        />
      )}
    </>
  );
}
