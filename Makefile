.DEFAULT_GOAL := help
.PHONY: help install dev backend frontend build test

help:
	@echo YogiTrack commands:
	@echo   make install   Install backend and frontend dependencies
	@echo   make dev       Run API and Angular together
	@echo   make backend   Run only the API on http://localhost:3000
	@echo   make frontend  Run only Angular on http://localhost:4200
	@echo   make build     Build backend and frontend
	@echo   make test      Run backend and frontend tests

install:
	npm --prefix backend install
	npm --prefix frontend install

dev:
	$(MAKE) -j2 backend frontend

backend:
	npm --prefix backend run dev

frontend:
	npm --prefix frontend start

build:
	npm --prefix backend run build
	npm --prefix frontend run build

test:
	npm --prefix backend test
	npm --prefix frontend test -- --watch=false
