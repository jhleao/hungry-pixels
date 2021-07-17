import express from 'express';
import { createGame } from '../public/js/game.js';
import * as io from 'socket.io';
import * as dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import hexToRgb from './utils/hexToRgb.js';
import getIdealTextColor from './utils/getIdealTextColor.js';
dotenv.config();

const { JWT_SECRET, JWT_EXPIRY, ADMIN_PASS } = process.env;
if (!JWT_SECRET) {
  console.error('ERROR: Please provide JWT_SECRET in your .env file.');
  process.exit();
}
if (!JWT_EXPIRY) {
  console.error('ERROR: Please provide JWT_EXPIRY in your .env file.');
  process.exit();
}

class App {
  express = express();
  game;
  tokens = [];

  constructor() {
    this.middlewares();
    this.initializeGame();
  }

  middlewares() {
    this.express.use(express.json());
    this.express.use(express.urlencoded({ extended: true }));
    this.express.use(cookieParser());
    this.express.use('/css', express.static('public/css'));
    this.express.use('/js', express.static('public/js'));
    this.express.use('/assets', express.static('public/assets'));
    this.express.set('view engine', 'ejs');

    this.express.get('/login', (req, res) => res.render('login'));

    this.express.get('/', this.authOnly.bind(this), (req, res) => {
      res.render('game');
    });

    this.express.get('/admin', this.adminAuthOnly.bind(this), (req, res) =>
      res.render('admin-game')
    );

    this.express.get('/admin/login', (req, res) => res.render('admin-login'));

    this.express.get('/api/me', this.apiAuthOnly.bind(this), (req, res) => {
      const { name, color } = req.user;
      res.send({ name, color });
    });

    this.express.post(
      '/api/logout',
      this.apiAuthOnly.bind(this),
      (req, res) => {
        this.tokens.splice(this.tokens.indexOf(req.token), 1);
        res.send({ success: true });
      }
    );

    this.express.post('/api/login', (req, res) => {
      const { name, color } = req.body;
      if (!name) return res.send({ success: false });

      const newToken = jwt.sign({ name, color }, JWT_SECRET, {
        expiresIn: JWT_EXPIRY,
      });

      this.tokens.push(newToken);

      res.cookie('SMGSID', newToken, { httpOnly: true, maxAge: JWT_EXPIRY });
      return res.send({ success: true });
    });

    this.express.post('/api/admin/login', (req, res) => {
      const { name, password } = req.body;
      if (!name || !password || password !== ADMIN_PASS)
        return res.send({ success: false });

      const newToken = jwt.sign({ name, admin: true }, JWT_SECRET, {
        expiresIn: JWT_EXPIRY,
      });
      this.tokens.push(newToken);

      res.cookie('SMGSID', newToken, { httpOnly: true, maxAge: JWT_EXPIRY });
      return res.send({ success: true });
    });

    this.express.post(
      '/api/admin/frequency',
      this.apiAdminAuthOnly.bind(this),
      (req, res) => {
        const { frequency } = req.body;
        this.game.setFrequency(frequency);
        return res.sendStatus(200);
      }
    );

    this.express.post(
      '/api/admin/start',
      this.apiAdminAuthOnly.bind(this),
      (req, res) => {
        this.sockets.emit('start-countdown');
        setTimeout(() => this.game.start(), 3000);
        return res.sendStatus(200);
      }
    );

    this.express.post(
      '/api/admin/stop',
      this.apiAdminAuthOnly.bind(this),
      (req, res) => {
        this.game.stop();
        return res.sendStatus(200);
      }
    );

    this.express.post(
      '/api/admin/resetscores',
      this.apiAdminAuthOnly.bind(this),
      (req, res) => {
        this.game.resetScores();
        return res.sendStatus(200);
      }
    );

    this.express.post(
      '/api/admin/clearfruits',
      this.apiAdminAuthOnly.bind(this),
      (req, res) => {
        this.game.clearFruits();
        return res.sendStatus(200);
      }
    );

    this.express.post(
      '/api/admin/size',
      this.apiAdminAuthOnly.bind(this),
      (req, res) => {
        const { width, height } = req.body;
        this.game.setScreenSize(width, height);
        this.emitStateAndConfigToAll();
        return res.sendStatus(200);
      }
    );

    this.express.post(
      '/api/admin/target',
      this.apiAdminAuthOnly.bind(this),
      (req, res) => {
        const { target } = req.body;
        if (target < 1) {
          this.game.setTarget(null);
          this.emitStateAndConfigToAll();
          return res.sendStatus(200);
        }
        this.game.setTarget(target);
        this.emitStateAndConfigToAll();
        return res.sendStatus(200);
      }
    );

    this.express.get(
      '/api/admin/config',
      this.apiAdminAuthOnly.bind(this),
      (req, res) => {
        const { state, config } = this.getStateAndConfig();
        res.send({ state, config });
      }
    );
  }

  getStateAndConfig() {
    const state = { ...this.game.state };
    const config = { ...this.game.config };
    delete config.intervalId;
    return { state, config };
  }

  emitStateAndConfigToAll() {
    const { state, config } = this.getStateAndConfig();
    this.sockets.emit('setup', state, config);
  }

  emitStateAndConfigToSocket(socket) {
    const { state, config } = this.getStateAndConfig();
    socket.emit('setup', state, config);
  }

  // TODO move this into separate file (must separate tokens storage too)
  authOnly(req, res, next) {
    const token = req.cookies.SMGSID;
    if (!token || !this.tokens.includes(token)) return res.redirect('/login');
    try {
      req.user = jwt.verify(token, JWT_SECRET);
      req.token = token;
      return next();
    } catch {
      return res.redirect('/login');
    }
  }

  // TODO move this into separate file (must separate tokens storage too)
  apiAuthOnly(req, res, next) {
    const token = req.cookies.SMGSID;
    if (!token || !this.tokens.includes(token)) return res.sendStatus(401);
    try {
      req.user = jwt.verify(token, JWT_SECRET);
      req.token = token;
      return next();
    } catch {
      return res.sendStatus(401);
    }
  }

  // TODO move this into separate file (must separate tokens storage too)
  adminAuthOnly(req, res, next) {
    const token = req.cookies.SMGSID;
    if (!token || !this.tokens.includes(token))
      return res.redirect('/admin/login');
    try {
      req.user = jwt.verify(token, JWT_SECRET);
      req.token = token;
      const isAdmin = req.user.admin;
      if (!isAdmin) return res.redirect('/');
      return next();
    } catch {
      return res.redirect('/admin/login');
    }
  }

  // TODO move this into separate file (must separate tokens storage too)
  apiAdminAuthOnly(req, res, next) {
    const token = req.cookies.SMGSID;
    if (!token || !this.tokens.includes(token)) return res.sendStatus(401);
    try {
      req.user = jwt.verify(token, JWT_SECRET);
      req.token = token;
      const isAdmin = req.user.admin;
      if (!isAdmin) return res.sendStatus(401);
      return next();
    } catch {
      return res.sendStatus(401);
    }
  }

  initializeGame() {
    this.game = createGame({ width: 10, height: 10 });
  }

  initializeSockets(server) {
    this.sockets = new io.Server(server);

    this.sockets.on('connection', (socket) => {
      const playerId = socket.id;

      console.log('Socket connected on Server with id ' + playerId);

      const playerName = socket.handshake.auth.name;
      const playerColorHex = socket.handshake.auth.color;
      const playerColorRgb = hexToRgb(playerColorHex);
      const playerTextColor = getIdealTextColor(playerColorRgb);

      this.game.addPlayer({
        playerId,
        playerName,
        playerColor: playerColorHex,
        playerTextColor,
      });

      this.emitStateAndConfigToSocket(socket);

      socket.on('disconnect', () => {
        this.game.removePlayer({ playerId });
      });
      socket.on('move-player', (command) => {
        command.playerId = playerId;
        command.type = 'move-player';
        this.game.movePlayer(command);
      });
      this.game.subscribe((command) => {
        socket.emit(command.type, command);
      });
    });
  }
}

export const app = new App();
