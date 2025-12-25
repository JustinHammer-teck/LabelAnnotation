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

        devShells.default = pkgs.mkShellNoCC {
          name = "labelstudio";

          packages =
            with pkgs;
            [
              python313
              poetry
              ruff
              ty
              vtsls
              nodejs
              yarn
              pre-commit
              libGL
              libglvnd
              glib
              zlib
            ]
            ++ (with pkgs.python313Packages; [
              pip
              easyocr
              stdenv.cc.cc.lib
            ]);

          shellHook = ''
            poetry env use "$(which python)"
            poetry install
            source "$(poetry env info --path)/bin/activate"

            # Install CPU-only PyTorch versions
            # echo "Installing CPU-only PyTorch packages..."
            # pip install torch torchvision --index-url https://download.pytorch.org/whl/cpu --force-reinstall --no-deps

            export LD_LIBRARY_PATH=${pkgs.stdenv.cc.cc.lib}/lib:${pkgs.libGL}/lib:${pkgs.libglvnd}/lib:${pkgs.glib.out}/lib:${pkgs.zlib}/lib:$LD_LIBRARY_PATH
          '';

          VTSLS_PATH = "${pkgs.vtsls}/bin/vtsls";
          RUFFPATH = "${pkgs.ruff}/bin/ruff";
          TYPATH = "${pkgs.ty}/bin/ty";
        };
      }
    );
}
