{
  description = "A Nix-flake-based python development environment - this only fit with my Intel-base MacBook";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixpkgs-unstable";
    old-nixpkgs.url = "github:NixOS/nixpkgs/72bbea9db7d727ed044e60b5f5febc60a3c5c955";
    poetry2nix = {
      url = "github:nix-community/poetry2nix";
      inputs.nixpkgs.follows = "nixpkgs";
    };
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
        oldPkgs = import inputs.old-nixpkgs { inherit system; };
      in
      {

        devShells.default = pkgs.mkShell {
          name = "labelstudio";

          packages = with pkgs; [
            poetry
            oldPkgs.python310
            black
            ruff
            vtsls
            nodejs
            yarn
            pyright
            prettierd
            eslint_d
            pre-commit
          ];

          shellHook = ''
            poetry env use "$(which python)"
            poetry install
            source "$(poetry env info --path)/bin/activate"
          '';

          PYRIGHT = "${pkgs.pyright}/bin/pyright";
          VTSLS_PATH = "${pkgs.vtsls}/bin/vtsls";
        };
      }
    );
}
