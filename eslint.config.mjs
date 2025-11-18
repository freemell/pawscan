import eslint from "@eslint/js";
import next from "eslint-config-next";
import tseslint from "typescript-eslint";

export default tseslint.config(
  eslint.configs.recommended,
  ...next({
    appDir: true,
  }),
);
