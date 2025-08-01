{
  description = "A Nix-flake-based python development environment - this only fit with my Intel-base MacBook";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixpkgs-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs =
    {
      self,
      nixpkgs,
      flake-utils,
      ...
    }@inputs:
    flake-utils.lib.eachSystem [ "x86_64-linux" "x86_64-darwin" ] (
      system:
      let
        pkgs = import nixpkgs {
          inherit system;
        };
      in
      {

        devShells.default = pkgs.mkShell {
          name = "labelstudio";

          packages =
            with pkgs;
            [
              python313
              poetry
              ruff
              ty
              uv
              vtsls
              nodejs
              yarn
              prettierd
              eslint_d
              pre-commit
            ]
            ++ (with pkgs.python313Packages; [
              python-lsp-server
            ]);

          shellHook = ''
            poetry env use "$(which python)"
            poetry install
            source "$(poetry env info --path)/bin/activate"
          '';

          VTSLS_PATH = "${pkgs.vtsls}/bin/vtsls";
          RUFFPATH = "${pkgs.ruff}/bin/ruff";
          TYPATH = "${pkgs.ty}/bin/ty";
          PYLSP = "${pkgs.python313Packages.python-lsp-server}/bin/pylsp";
        };
      }
    );
}
